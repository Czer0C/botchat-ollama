### Simple UI for demo-ing ollama self-host

### Notes
* This is for self-hosting only, meaning cannot use vercel or netlify or other providers because this is meant to work as a one package solution.
* First install ollama on host server: `curl -fsSL https://ollama.com/install.sh | sh`
* Then pull source code
* Build and run with pm2
* Might need a server with minimum of 8GB of ram to work or the ollama is gonna choke so hard.
* Bonus: use cloudflare for a little extra speed with free CDN solution.
