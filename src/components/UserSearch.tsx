import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import UserCard from './UserCard';
import RencentSearches from './RecentRearches';
import {useQueryClient} from '@tanstack/react-query'
import {fetchGitHubUser, searchGitHubUsers} from '../api/github';
import { useDebounce } from 'use-debounce';
import SuggestionDropdown from './SuggestionDropdown';


const UserSearch = () => {
  const [username, setUsername] = useState('');
  const [submittedUsername, setSubmittedUsername] = useState('');
  
  const [recentUsers, setRecentUsers] = useState<string[]>(() => {
  const stored = localStorage.getItem('recentUsers');
  return stored ? JSON.parse(stored) : [];
});
  useEffect(()=>{
    localStorage.setItem('recentUsers', JSON.stringify(recentUsers))
  },[recentUsers])

  const queryClient = useQueryClient();

  const [debouncedUsername] = useDebounce(username, 300);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['users', submittedUsername],
    queryFn: async () => {
      const token = import.meta.env.VITE_GITHUB_API_TOKEN;
      const res = await fetch(
        `https://api.github.com/users/${submittedUsername}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );
      if (res.status === 404) {
        throw new Error('User not found');
      }
      if (res.status === 401) {
        throw new Error('Invalid GitHub token (401)');
      }
      if (res.status === 403) {
        throw new Error('GitHub API rate limit exceeded (403)');
      }
      if (!res.ok) {
        throw new Error(`GitHub API error (${res.status})`);
      }

      const data = await res.json();

      console.log(data);

      return data;
    },
    enabled: !!submittedUsername,
  });

  // Fetch suggestions from GitHub's search API
  const { data: suggestions } = useQuery({
    queryKey: ['github-user-suggestions', debouncedUsername],
    queryFn: () => searchGitHubUsers(debouncedUsername),
    enabled: debouncedUsername.length > 1,
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = username.trim();
    if(!trimmed) return;
    setSubmittedUsername(trimmed);
    setUsername('')
    setShowSuggestions(false)

    setRecentUsers((prev) => {
      const updated = [trimmed, ...prev.filter((u) => u !== trimmed)];
      return updated.slice(0, 5);
    });
  };

  return (
    <>
      <form onSubmit={handleSubmit} className='form'>
        <div className='dropdown-wrapper'>
          <input
            type='text'
            value={username}
            onChange={(e) => {
              const val = e.target.value;
              setUsername(val);
              setShowSuggestions(val.trim().length > 1);
            }}
            onBlur={() => {
              setTimeout(() => setShowSuggestions(false), 100);
            }}
            placeholder='Enter GitHub username'
          />

          <SuggestionDropdown
            suggestions={suggestions || []}
            show={showSuggestions}
            onSelect={(selected) => {
              setUsername(selected);
              setShowSuggestions(false);

              if (submittedUsername !== selected) {
                setSubmittedUsername(selected);
              } else {
                refetch(); // force fetch again if same user
              }

              setRecentUsers((prev) => {
                const updated = [selected, ...prev.filter((u) => u !== selected)];
                return updated.slice(0, 5);
              });
            }}
          />
        </div>
        <button type='submit'>Search</button>
      </form>

      {isLoading && <p className='status'>Loading...</p>}
      {error && <p className='status error'>{error.message}</p>}

      {data && (
        <UserCard user={data} />
      )}

      {
        recentUsers.length > 0 && (
          <RencentSearches users={recentUsers} 
          onSelect={(usename)=>{
            setUsername(usename)
            setSubmittedUsername(usename)
          }}
          onPrefetch={(user) => {
            queryClient.prefetchQuery({
              queryKey: ['users', user],
              queryFn: () => fetchGitHubUser(user),
            })
          }} />
        )
      }
    </>
  );
};

export default UserSearch;
