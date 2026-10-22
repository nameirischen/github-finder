import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import UserCard from './UserCard';

const UserSearch = () => {
  const [username, setUsername] = useState('');
  const [submittedUsername, setSubmittedUsername] = useState('');

  const { data, isLoading, error } = useQuery({
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

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmittedUsername(username.trim());
  };

  return (
    <>
      <form onSubmit={handleSubmit} className='form'>
        <input
          type='text'
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder='Enter GitHub username'
        />
        <button type='submit'>Search</button>
      </form>

      {isLoading && <p className='status'>Loading...</p>}
      {error && <p className='status error'>{error.message}</p>}

      {data && (
        <UserCard user={data} />
      )}
    </>
  );
};

export default UserSearch;
