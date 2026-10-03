
export interface GistSyncData {
  tasks: unknown;
  goals: unknown;
  settings: unknown;
  practice: unknown;
  courses?: unknown;
  updatedAt: string;
}

export async function pushToGist(token: string, gistId: string | undefined, data: GistSyncData): Promise<string> {
  const content = JSON.stringify(data, null, 2);
  const cleanToken = token.trim();
  const body: Record<string, any> = {
    description: 'Personal Daily Progress Tracker Cloud Backup',
    files: {
      'daily-tracker-data.json': {
        content,
      },
    },
  };

  // The 'public' property is only valid during creation (POST); sending it in PATCH returns 422
  if (!gistId) {
    body.public = false;
  }

  const url = gistId ? `https://api.github.com/gists/${gistId}` : 'https://api.github.com/gists';
  const method = gistId ? 'PATCH' : 'POST';

  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${cleanToken}`,
      Accept: 'application/vnd.github+json',
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
  const cleanToken = token.trim();
  const res = await fetch(`https://api.github.com/gists/${gistId}`, {
    headers: {
      Authorization: `Bearer ${cleanToken}`,
      Accept: 'application/vnd.github+json',
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch Gist (${res.status})`);
  }

  const json = await res.json();
  const file = json.files?.['daily-tracker-data.json'];
  if (!file) {
    throw new Error('Gist does not contain daily-tracker-data.json file');
  }

  if (file.content) {
    return JSON.parse(file.content) as GistSyncData;
  }

  if (file.raw_url) {
    const rawRes = await fetch(file.raw_url, {
      headers: {
        Authorization: `Bearer ${cleanToken}`,
      },
    });
    if (rawRes.ok) {
      return (await rawRes.json()) as GistSyncData;
    }
  }

  throw new Error('Gist file content is empty');
}

export async function validateGithubToken(token: string): Promise<{ username: string; scopes: string[] }> {
  const res = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3+json',
    },
  });

  if (!res.ok) {
    if (res.status === 401) {
      throw new Error('Invalid GitHub Personal Access Token. Please check your token.');
    }
    throw new Error(`GitHub authentication failed (${res.status})`);
  }

  const user = await res.json();
  const scopesHeader = res.headers.get('x-oauth-scopes') || '';
  const scopes = scopesHeader
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  return {
    username: user.login || 'GitHub User',
    scopes,
  };
}

export async function createSecretGist(
  token: string,
  data: GistSyncData,
  description = 'Personal Daily Progress Tracker Cloud Backup'
): Promise<string> {
  const content = JSON.stringify(data, null, 2);
  const body = {
    description,
    public: false,
    files: {
      'daily-tracker-data.json': {
        content,
      },
    },
  };

  const res = await fetch('https://api.github.com/gists', {
    method: 'POST',
    headers: {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Failed to create secret Gist (${res.status})`);
  }

  const json = await res.json();
  return json.id as string;
}

