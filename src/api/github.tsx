export const fetchGitHubUser = async (username: string) => {
  const res = await fetch(`https://api.github.com/users/${username}`);
  if (!res.ok) throw new Error('User not found');

  const data = await res.json();
  return data;
};

export const searchGitHubUsers = async (query: string) => {
  const res = await fetch(
    `${import.meta.env.VITE_GITHUB_API_URL}/search/users?q=${query}`
  );
  if (!res.ok) throw new Error('Failed to search users');

  const data = await res.json();
  return data.items;
};
