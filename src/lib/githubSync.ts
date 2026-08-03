
export interface GistSyncData {
  tasks: unknown;
  goals: unknown;
  settings: unknown;
  practice: unknown;
  updatedAt: string;
}

export async function pushToGist(token: string, gistId: string | undefined, data: GistSyncData): Promise<string> {
  const content = JSON.stringify(data, null, 2);
  const body = {
    description: 'Personal Daily Progress Tracker Backup',
    public: false,
    files: {
      'daily-tracker-data.json': {
        content,
      },
    },
  };

  const url = gistId ? `https://api.github.com/gists/${gistId}` : 'https://api.github.com/gists';
  const method = gistId ? 'PATCH' : 'POST';

  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `GitHub Gist API error: ${res.status}`);
  }

  const json = await res.json();
  return json.id as string;
}

export async function pullFromGist(token: string, gistId: string): Promise<GistSyncData> {
  const res = await fetch(`https://api.github.com/gists/${gistId}`, {
    headers: {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3+json',
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch Gist (${res.status})`);
  }

  const json = await res.json();
  const file = json.files['daily-tracker-data.json'];
  if (!file || !file.content) {
    throw new Error('Gist does not contain daily-tracker-data.json file');
  }

  return JSON.parse(file.content) as GistSyncData;
}
