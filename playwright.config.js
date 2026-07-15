webServer: {
  command: "npm run preview -- --host 127.0.0.1 --port 4173",
  url: "http://127.0.0.1:4173",
  reuseExistingServer: true,
  timeout: 120000,
  env: {
    ...process.env,
  },
},