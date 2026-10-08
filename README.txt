DELTA LIFE

RUN ON YOUR LAPTOP (no database needed)
1. Install Node.js LTS from https://nodejs.org
2. In this folder run:  node server.js
3. Open http://localhost:3000
Data is kept in data.json (back it up).

PUT IT ONLINE (Postgres)
1. Create a free Postgres database (for example at neon.tech) and copy its connection string.
2. Push this folder to a GitHub repo.
3. Create a Web Service on a host like Render or Railway from that repo:
   Build command: npm install     Start command: node server.js
4. Add an environment variable DATABASE_URL = your connection string.
The server creates its tables on first start. Run ONE server instance.

DEPLOY ON RAILWAY
1. Push this folder to a GitHub repo (or run: railway up).
2. In Railway: New Project > Deploy from GitHub repo. Start command is detected from package.json (npm start).
3. In the same project: New > Database > PostgreSQL.
4. Open your web service > Variables > add DATABASE_URL = ${{Postgres.DATABASE_URL}}
5. Settings > Networking > Generate Domain. Keep one replica.
If the app cannot connect to the database, add PGSSL=1 only when using the public database URL.

PUSH TO GITHUB (from this folder)
  git init && git add . && git commit -m "Delta Life"
  git branch -M main
  git remote add origin https://github.com/YOUR-NAME/delta-life.git
  git push -u origin main
