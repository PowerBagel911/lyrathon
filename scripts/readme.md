create the docker postgres database with 
```bash
docker-compose up
```

push drizzle schema to postgres database with 
npm run db:push

populate applicants, companies, jobs with mock data by
```bash
npx tsx --env-file=.env scripts/populateMockData.ts
```

read test.json file (for now let's read it manually) to input to repositories table (currently set with a fixed applicant ID) with
```bash
npx tsx --env-file=.env scripts/importGitHubRepos.ts
```
