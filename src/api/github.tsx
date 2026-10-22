const fetchGitHubUser = async (username: string) => {
  const res = await fetch(`https://api.github.com/users/${username}`);
  if (!res.ok) throw new Error('User not found');

  const data = await res.json();
  return data;
};

export default fetchGitHubUser;