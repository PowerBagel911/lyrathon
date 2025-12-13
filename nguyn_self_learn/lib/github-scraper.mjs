import dotenv from 'dotenv';
import { writeFile, mkdir, readFile } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Load environment variables from .env file (optional, won't error if missing)
dotenv.config();

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// GitHub API base URL
const GITHUB_API_BASE = 'https://api.github.com';

/**
 * Extract username from GitHub profile URL or return username directly
 */
function extractUsername(input) {
  if (!input || typeof input !== 'string' || input.trim().length === 0) {
    throw new Error('Input is required');
  }

  const trimmed = input.trim();

  // If it's a URL, extract username
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    if (!trimmed.includes('github.com')) {
      throw new Error('URL must be a GitHub profile URL');
    }
    
    const match = trimmed.match(/github\.com\/([^\/\?#]+)/);
    if (!match || !match[1]) {
      throw new Error('Could not extract username from URL');
    }
    return match[1];
  }

  return trimmed.startsWith('@') ? trimmed.slice(1) : trimmed;
}

/**
 * Make a request to GitHub API
 */
async function fetchGitHubAPI(endpoint, token = null) {
  const url = `${GITHUB_API_BASE}${endpoint}`;
  const headers = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'GitHub-Profile-Scraper',
  };

  if (token) {
    headers['Authorization'] = `token ${token}`;
  }

  const response = await fetch(url, { headers });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`GitHub user or resource not found: ${endpoint}`);
    }
    if (response.status === 403) {
      throw new Error('GitHub API rate limit exceeded. Consider using a GitHub personal access token.');
    }
    throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetch all pages from a paginated GitHub API endpoint
 */
async function fetchAllPages(endpoint, token = null) {
  const allItems = [];
  let page = 1;
  const perPage = 100;

  while (true) {
    const separator = endpoint.includes('?') ? '&' : '?';
    const paginatedEndpoint = `${endpoint}${separator}page=${page}&per_page=${perPage}`;
    
    const items = await fetchGitHubAPI(paginatedEndpoint, token);
    
    if (!Array.isArray(items) || items.length === 0) {
      break;
    }
    
    allItems.push(...items);
    
    if (items.length < perPage) {
      break;
    }
    
    page++;
  }

  return allItems;
}

/**
 * Fetch repo languages
 */
async function fetchRepoLanguages(repo, token) {
  try {
    const languagesUrl = repo.languages_url;
    const endpoint = languagesUrl.replace(GITHUB_API_BASE, '');
    const languages = await fetchGitHubAPI(endpoint, token);
    return languages;
  } catch (error) {
    return {};
  }
}

/**
 * Fetch root-level file names
 */
async function fetchRootFiles(repo, token) {
  try {
    const contentsUrl = repo.contents_url.replace('{+path}', '');
    const endpoint = contentsUrl.replace(GITHUB_API_BASE, '');
    const contents = await fetchGitHubAPI(endpoint, token);
    
    if (Array.isArray(contents)) {
      return contents
        .filter(item => item.type === 'file')
        .map(item => item.name);
    }
    return [];
  } catch (error) {
    return [];
  }
}

/**
 * Fetch last 20 commits
 */
async function fetchRecentCommits(repo, token) {
  try {
    const commitsUrl = repo.commits_url.replace('{/sha}', '');
    const endpoint = commitsUrl.replace(GITHUB_API_BASE, '');
    const commits = await fetchGitHubAPI(`${endpoint}?per_page=20`, token);
    
    if (Array.isArray(commits)) {
      return commits.map(commit => ({
        author: commit.author?.login || commit.commit?.author?.name || 'unknown',
        date: commit.commit?.author?.date || commit.commit?.committer?.date || null,
        message: commit.commit?.message || '',
      }));
    }
    return [];
  } catch (error) {
    return [];
  }
}

/**
 * Fetch dependencies from common dependency files
 */
async function fetchDependencies(repo, token) {
  try {
    const contentsUrl = repo.contents_url.replace('{+path}', '');
    const endpoint = contentsUrl.replace(GITHUB_API_BASE, '');
    const contents = await fetchGitHubAPI(endpoint, token);
    
    if (!Array.isArray(contents)) {
      return null;
    }

    const dependencies = [];
    const dependencyFiles = [
      { name: 'package.json', type: 'npm' },
      { name: 'requirements.txt', type: 'python' },
      { name: 'Pipfile', type: 'python' },
      { name: 'pom.xml', type: 'maven' },
      { name: 'build.gradle', type: 'gradle' },
      { name: 'Cargo.toml', type: 'rust' },
      { name: 'go.mod', type: 'go' },
    ];

    for (const depFile of dependencyFiles) {
      const file = contents.find(item => item.name === depFile.name && item.type === 'file');
      if (file && file.download_url) {
        try {
          const fileContent = await fetch(file.download_url).then(r => r.text());
          
          if (depFile.type === 'npm' && file.name === 'package.json') {
            const pkg = JSON.parse(fileContent);
            const deps = { ...pkg.dependencies, ...pkg.devDependencies };
            dependencies.push(...Object.keys(deps));
          } else if (depFile.type === 'python' && (file.name === 'requirements.txt' || file.name === 'Pipfile')) {
            const lines = fileContent.split('\n');
            for (const line of lines) {
              const trimmed = line.trim();
              if (trimmed && !trimmed.startsWith('#')) {
                const pkgName = trimmed.split(/[>=<!=]/)[0].trim();
                if (pkgName) dependencies.push(pkgName);
              }
            }
          }
        } catch (err) {
          // Skip if file can't be parsed
        }
      }
    }

    return dependencies.length > 0 ? dependencies : null;
  } catch (error) {
    return null;
  }
}

/**
 * Fetch imports from common source files
 */
async function fetchImports(repo, token) {
  try {
    const contentsUrl = repo.contents_url.replace('{+path}', '');
    const endpoint = contentsUrl.replace(GITHUB_API_BASE, '');
    const contents = await fetchGitHubAPI(endpoint, token);
    
    if (!Array.isArray(contents)) {
      return null;
    }

    const imports = new Set();
    const sourceExtensions = ['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.go', '.rs'];
    
    for (const item of contents) {
      if (item.type === 'file' && sourceExtensions.some(ext => item.name.endsWith(ext))) {
        try {
          if (item.download_url) {
            const fileContent = await fetch(item.download_url).then(r => r.text());
            
            const lines = fileContent.split('\n');
            for (const line of lines) {
              const jsImport = line.match(/^(?:import|from)\s+['"]([^'"]+)['"]/);
              if (jsImport) imports.add(jsImport[1]);
              
              const pyImport = line.match(/^(?:import|from)\s+([a-zA-Z0-9_.]+)/);
              if (pyImport) imports.add(pyImport[1].split('.')[0]);
              
              const javaImport = line.match(/^import\s+([a-zA-Z0-9_.]+)/);
              if (javaImport) imports.add(javaImport[1]);
            }
          }
        } catch (err) {
          // Skip if file can't be read
        }
      }
    }

    return imports.size > 0 ? Array.from(imports).slice(0, 50) : null;
  } catch (error) {
    return null;
  }
}

/**
 * Fetch README excerpt (first 2000 characters)
 */
async function fetchReadmeExcerpt(repo, token) {
  try {
    const contentsUrl = repo.contents_url.replace('{+path}', '');
    const endpoint = contentsUrl.replace(GITHUB_API_BASE, '');
    const contents = await fetchGitHubAPI(endpoint, token);
    
    if (!Array.isArray(contents)) {
      return null;
    }

    const readmeFile = contents.find(item => 
      item.type === 'file' && 
      (item.name.toLowerCase() === 'readme.md' || item.name.toLowerCase() === 'readme')
    );

    if (!readmeFile) {
      return null;
    }

    const readmeEndpoint = repo.contents_url.replace('{+path}', 'README.md');
    const readmeEndpointPath = readmeEndpoint.replace(GITHUB_API_BASE, '');
    const readmeData = await fetchGitHubAPI(readmeEndpointPath, token);

    if (readmeData.content && readmeData.encoding === 'base64') {
      const content = Buffer.from(readmeData.content, 'base64').toString('utf-8');
      return content.slice(0, 2000);
    }

    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Fetch evidence data for a single repo
 */
async function fetchRepoEvidence(repo, token) {
  const languages = await fetchRepoLanguages(repo, token);
  const rootFiles = await fetchRootFiles(repo, token);
  const dependencies = await fetchDependencies(repo, token);
  const imports = await fetchImports(repo, token);
  const recentCommits = await fetchRecentCommits(repo, token);
  const readmeExcerpt = await fetchReadmeExcerpt(repo, token);
  
  return {
    repo: {
      name: repo.name,
      url: repo.html_url,
      fork: repo.fork,
      pushed_at: repo.pushed_at,
    },
    evidence: {
      languages,
      root_files: rootFiles,
      dependencies,
      imports,
      recent_commits: recentCommits,
      readme_excerpt: readmeExcerpt,
    },
  };
}

/**
 * Scrape GitHub profile and return repositories data
 */
export async function scrapeGitHubProfile(githubUrl, githubToken = null) {
  const username = extractUsername(githubUrl);
  const token = githubToken || process.env.GITHUB_TOKEN || null;

  // Fetch repositories
  const repos = await fetchAllPages(`/users/${username}/repos`, token);

  // Fetch evidence for all repos
  const repoEvidence = [];
  for (const repo of repos) {
    try {
      const evidence = await fetchRepoEvidence(repo, token);
      repoEvidence.push(evidence);
    } catch (error) {
      repoEvidence.push({
        repo: {
          name: repo.name,
          url: repo.html_url,
          fork: repo.fork,
          pushed_at: repo.pushed_at,
        },
        evidence: null,
      });
    }
  }

  // Build enriched repos
  const evidenceMap = new Map();
  for (const evidenceData of repoEvidence) {
    evidenceMap.set(evidenceData.repo.name, evidenceData);
  }

  const enrichedRepos = repos.map(repo => {
    const evidenceData = evidenceMap.get(repo.name);
    if (evidenceData) {
      return evidenceData;
    }
    return {
      repo: {
        name: repo.name,
        url: repo.html_url,
        fork: repo.fork,
        pushed_at: repo.pushed_at,
      },
      evidence: null,
    };
  });

  return {
    type: 'repositories',
    data: enrichedRepos,
  };
}

