#!/usr/bin/env node

/**
 * GitHub Profile Scraper (using GitHub API)
 * 
 * Usage: node scrape.mjs <githubProfileUrlOrUsername> [githubToken]
 * 
 * GitHub token is optional but recommended:
 * - Without token: 60 requests/hour (unauthenticated)
 * - With token: 5000 requests/hour (authenticated)
 * 
 * Token can be provided:
 * 1. As 2nd command line argument (recommended)
 * 2. Via GITHUB_TOKEN environment variable
 * 3. Via .env file (optional fallback)
 * 
 * This script:
 * 1. Takes a GitHub profile URL or username as input
 * 2. Fetches comprehensive profile data using GitHub REST API
 * 3. Saves all data to ./out/<timestamp>/ directory
 */

import dotenv from 'dotenv';
import { writeFile, mkdir } from 'fs/promises';
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
    throw new Error('Input is required. Usage: node scrape.mjs <githubProfileUrlOrUsername> [githubToken]');
  }

  const trimmed = input.trim();

  // If it's a URL, extract username
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    if (!trimmed.includes('github.com')) {
      throw new Error('URL must be a GitHub profile URL');
    }
    
    // Extract username from URL patterns:
    // https://github.com/username
    // https://github.com/username/
    const match = trimmed.match(/github\.com\/([^\/\?#]+)/);
    if (!match || !match[1]) {
      throw new Error('Could not extract username from URL');
    }
    return match[1];
  }

  // Otherwise, treat it as a username
  // Remove leading @ if present
  return trimmed.startsWith('@') ? trimmed.slice(1) : trimmed;
}

/**
 * Get GitHub token from various sources (CLI arg > env var > .env file)
 */
function getGitHubToken() {
  // 1. Try command line argument (2nd argument)
  const cliToken = process.argv[3];
  if (cliToken && cliToken.trim().length > 0) {
    return cliToken.trim();
  }

  // 2. Try environment variable
  const envToken = process.env.GITHUB_TOKEN;
  if (envToken && envToken.trim().length > 0) {
    return envToken.trim();
  }

  // 3. No token found (optional)
  return null;
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
      const rateLimitRemaining = response.headers.get('x-ratelimit-remaining');
      const rateLimitReset = response.headers.get('x-ratelimit-reset');
      throw new Error(
        `GitHub API rate limit exceeded. Remaining: ${rateLimitRemaining || 'unknown'}. ` +
        `Reset at: ${rateLimitReset ? new Date(parseInt(rateLimitReset) * 1000).toISOString() : 'unknown'}. ` +
        `Consider using a GitHub personal access token for higher limits.`
      );
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
  const perPage = 100; // Maximum items per page

  while (true) {
    const separator = endpoint.includes('?') ? '&' : '?';
    const paginatedEndpoint = `${endpoint}${separator}page=${page}&per_page=${perPage}`;
    
    const items = await fetchGitHubAPI(paginatedEndpoint, token);
    
    if (!Array.isArray(items) || items.length === 0) {
      break;
    }
    
    allItems.push(...items);
    console.log(`   Fetched page ${page}: ${items.length} items (total: ${allItems.length})`);
    
    // If we got fewer items than perPage, we've reached the last page
    if (items.length < perPage) {
      break;
    }
    
    page++;
  }

  return allItems;
}

/**
 * Create output directory with timestamp
 */
async function createOutputDir() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outputDir = join(__dirname, 'out', timestamp);
  await mkdir(outputDir, { recursive: true });
  await mkdir(join(outputDir, 'items'), { recursive: true });
  return outputDir;
}

/**
 * Select top 5 repos (prefer non-forks, most recent pushed_at)
 */
function selectTopRepos(repos) {
  // Sort: non-forks first, then by pushed_at (most recent first)
  const sorted = [...repos].sort((a, b) => {
    // Prefer non-forks
    if (a.fork !== b.fork) {
      return a.fork ? 1 : -1;
    }
    // Then by most recent pushed_at
    const dateA = new Date(a.pushed_at || 0);
    const dateB = new Date(b.pushed_at || 0);
    return dateB - dateA;
  });
  
  return sorted.slice(0, 5);
}

/**
 * Fetch repo languages
 */
async function fetchRepoLanguages(repo, token) {
  try {
    // Extract endpoint from languages_url (e.g., /repos/owner/repo/languages)
    const languagesUrl = repo.languages_url;
    const endpoint = languagesUrl.replace(GITHUB_API_BASE, '');
    const languages = await fetchGitHubAPI(endpoint, token);
    return languages;
  } catch (error) {
    console.warn(`   ⚠️  Failed to fetch languages for ${repo.name}: ${error.message}`);
    return {};
  }
}

/**
 * Fetch root-level file names
 */
async function fetchRootFiles(repo, token) {
  try {
    // Extract endpoint from contents_url and get root directory
    const contentsUrl = repo.contents_url.replace('{+path}', '');
    const endpoint = contentsUrl.replace(GITHUB_API_BASE, '');
    const contents = await fetchGitHubAPI(endpoint, token);
    
    // Filter for files only (not directories) and return names
    if (Array.isArray(contents)) {
      return contents
        .filter(item => item.type === 'file')
        .map(item => item.name);
    }
    return [];
  } catch (error) {
    console.warn(`   ⚠️  Failed to fetch root files for ${repo.name}: ${error.message}`);
    return [];
  }
}

/**
 * Fetch last 20 commits
 */
async function fetchRecentCommits(repo, token) {
  try {
    // Extract endpoint from commits_url
    const commitsUrl = repo.commits_url.replace('{/sha}', '');
    const endpoint = commitsUrl.replace(GITHUB_API_BASE, '');
    const commits = await fetchGitHubAPI(`${endpoint}?per_page=20`, token);
    
    // Extract relevant commit info
    if (Array.isArray(commits)) {
      return commits.map(commit => ({
        author: commit.author?.login || commit.commit?.author?.name || 'unknown',
        date: commit.commit?.author?.date || commit.commit?.committer?.date || null,
        message: commit.commit?.message || '',
      }));
    }
    return [];
  } catch (error) {
    console.warn(`   ⚠️  Failed to fetch commits for ${repo.name}: ${error.message}`);
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
            // Extract package names from requirements.txt
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
    console.warn(`   ⚠️  Failed to fetch dependencies for ${repo.name}: ${error.message}`);
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
    
    // Check root-level source files
    for (const item of contents) {
      if (item.type === 'file' && sourceExtensions.some(ext => item.name.endsWith(ext))) {
        try {
          if (item.download_url) {
            const fileContent = await fetch(item.download_url).then(r => r.text());
            
            // Extract import statements
            const lines = fileContent.split('\n');
            for (const line of lines) {
              // JavaScript/TypeScript imports
              const jsImport = line.match(/^(?:import|from)\s+['"]([^'"]+)['"]/);
              if (jsImport) imports.add(jsImport[1]);
              
              // Python imports
              const pyImport = line.match(/^(?:import|from)\s+([a-zA-Z0-9_.]+)/);
              if (pyImport) imports.add(pyImport[1].split('.')[0]);
              
              // Java imports
              const javaImport = line.match(/^import\s+([a-zA-Z0-9_.]+)/);
              if (javaImport) imports.add(javaImport[1]);
            }
          }
        } catch (err) {
          // Skip if file can't be read
        }
      }
    }

    return imports.size > 0 ? Array.from(imports).slice(0, 50) : null; // Limit to 50 imports
  } catch (error) {
    console.warn(`   ⚠️  Failed to fetch imports for ${repo.name}: ${error.message}`);
    return null;
  }
}

/**
 * Fetch evidence data for a single repo (sequential requests)
 */
async function fetchRepoEvidence(repo, token) {
  console.log(`   📦 Processing: ${repo.name}...`);
  
  // Sequential requests only
  const languages = await fetchRepoLanguages(repo, token);
  const rootFiles = await fetchRootFiles(repo, token);
  const dependencies = await fetchDependencies(repo, token);
  const imports = await fetchImports(repo, token);
  const recentCommits = await fetchRecentCommits(repo, token);
  
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
    },
  };
}

/**
 * Save data to JSON file
 */
async function saveJsonFile(filePath, data) {
  const jsonContent = JSON.stringify(data, null, 2);
  await writeFile(filePath, jsonContent, 'utf-8');
}

/**
 * Main execution function
 */
async function main() {
  try {
    // Get input from command line arguments
    const input = process.argv[2];
    const username = extractUsername(input);
    
    console.log('🚀 Starting GitHub Profile Scraper');
    console.log(`📋 Target: ${username}`);
    console.log(`🔗 Profile URL: https://github.com/${username}\n`);

    // Get GitHub token (optional but recommended)
    const githubToken = getGitHubToken();
    if (githubToken) {
      console.log('🔑 Using GitHub token (authenticated - 5000 requests/hour)');
    } else {
      console.log('⚠️  No GitHub token provided (unauthenticated - 60 requests/hour)');
      console.log('   Consider providing a token for higher rate limits\n');
    }

    // Fetch comprehensive GitHub profile data
    console.log('📥 Fetching GitHub profile data...\n');

    // 1. User profile (basic info)
    console.log('📊 Fetching user profile...');
    const profile = await fetchGitHubAPI(`/users/${username}`, githubToken);
    console.log(`✅ Profile fetched: ${profile.name || profile.login}\n`);

    // 2. User repositories
    console.log('📦 Fetching repositories...');
    const repos = await fetchAllPages(`/users/${username}/repos`, githubToken);
    console.log(`✅ Fetched ${repos.length} repositories\n`);

    // 2a. Fetch evidence for all repos
    console.log(`🔍 Fetching evidence for all ${repos.length} repositories...\n`);
    
    const repoEvidence = [];
    for (const repo of repos) {
      try {
        const evidence = await fetchRepoEvidence(repo, githubToken);
        repoEvidence.push(evidence);
        console.log(`   ✅ Completed: ${repo.name}\n`);
      } catch (error) {
        // Even if evidence fetch fails, include repo with minimal structure
        console.warn(`   ⚠️  Evidence fetch failed for ${repo.name}: ${error.message}`);
        repoEvidence.push({
          repo: {
            name: repo.name,
            url: repo.html_url,
            fork: repo.fork,
            pushed_at: repo.pushed_at,
          },
          evidence: null,
        });
        console.log(`   ✅ Included with minimal data: ${repo.name}\n`);
      }
    }
    console.log(`✅ Fetched evidence for ${repoEvidence.length} repositories\n`);

    // 3. User followers
    console.log('👥 Fetching followers...');
    const followers = await fetchAllPages(`/users/${username}/followers`, githubToken);
    console.log(`✅ Fetched ${followers.length} followers\n`);

    // 4. User following
    console.log('👤 Fetching following...');
    const following = await fetchAllPages(`/users/${username}/following`, githubToken);
    console.log(`✅ Fetched ${following.length} following\n`);

    // 5. Starred repositories
    console.log('⭐ Fetching starred repositories...');
    const starred = await fetchAllPages(`/users/${username}/starred`, githubToken);
    console.log(`✅ Fetched ${starred.length} starred repositories\n`);

    // 6. User organizations
    console.log('🏢 Fetching organizations...');
    const organizations = await fetchAllPages(`/users/${username}/orgs`, githubToken);
    console.log(`✅ Fetched ${organizations.length} organizations\n`);

    // 7. User events (public activity)
    console.log('📅 Fetching public events...');
    const events = await fetchAllPages(`/users/${username}/events/public`, githubToken);
    console.log(`✅ Fetched ${events.length} public events\n`);

    // Enrich repositories with evidence data
    // Create a map of evidence by repo name for quick lookup
    const evidenceMap = new Map();
    for (const evidenceData of repoEvidence) {
      evidenceMap.set(evidenceData.repo.name, evidenceData);
    }

    // Build enriched repos with only specified fields + evidence
    const enrichedRepos = repos.map(repo => {
      const evidenceData = evidenceMap.get(repo.name);
      if (evidenceData) {
        // Use the evidence structure directly (already has repo + evidence)
        return evidenceData;
      }
      // If no evidence, return minimal structure
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

    // Compile all data into items array
    const allItems = [
      { type: 'profile', data: profile },
      { type: 'repositories', data: enrichedRepos },
      { type: 'followers', data: followers },
      { type: 'following', data: following },
      { type: 'starred', data: starred },
      { type: 'organizations', data: organizations },
      { type: 'events', data: events },
    ];

    // Create run metadata object
    const runMetadata = {
      username,
      profileUrl: `https://github.com/${username}`,
      scrapedAt: new Date().toISOString(),
      authenticated: !!githubToken,
      itemsCount: allItems.length,
      dataSummary: {
        profile: profile.login,
        repositories: repos.length,
        followers: followers.length,
        following: following.length,
        starred: starred.length,
        organizations: organizations.length,
        events: events.length,
      },
    };

    // Create output directory
    const outputDir = await createOutputDir();
    console.log(`📁 Output directory: ${outputDir}\n`);

    // Save run metadata
    const runFilePath = join(outputDir, 'run.json');
    await saveJsonFile(runFilePath, runMetadata);
    console.log(`💾 Saved run metadata: run.json`);

    // Save all items as a single array
    const datasetFilePath = join(outputDir, 'dataset.json');
    await saveJsonFile(datasetFilePath, allItems);
    console.log(`💾 Saved all items: dataset.json`);

    // Save each item as a separate file
    console.log(`💾 Saving individual item files...`);
    for (let i = 0; i < allItems.length; i++) {
      const item = allItems[i];
      const fileName = `${item.type}.json`;
      const itemFilePath = join(outputDir, 'items', fileName);
      await saveJsonFile(itemFilePath, item);
      console.log(`   Saved: ${fileName}`);
    }
    console.log(`   Saved ${allItems.length} individual item files\n`);

    console.log('✨ Scraping completed successfully!');
    console.log(`📂 All data saved to: ${outputDir}`);
    console.log(`\n📊 Summary:`);
    console.log(`   - Profile: ${profile.name || profile.login}`);
    console.log(`   - Repositories: ${repos.length}`);
    console.log(`   - Repo Evidence: ${repoEvidence.length} repos processed`);
    console.log(`   - Followers: ${followers.length}`);
    console.log(`   - Following: ${following.length}`);
    console.log(`   - Starred: ${starred.length}`);
    console.log(`   - Organizations: ${organizations.length}`);
    console.log(`   - Events: ${events.length}`);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Run the main function
main();
