## running the demos

First install the necessary tools:
```
npm install beefy -g
npm install browserify -g
```

Then run the app: 
```
beefy orbit.js --cwd demos --live -- -r './lib/index.js:cam3d'
beefy simple.js --cwd demos --live -- -r './lib/index.js:cam3d'
beefy shadow.js --cwd demos --live -- -r './lib/index.js:cam3d'
beefy godrays.js --cwd demos --live -- -r './lib/index.js:cam3d'
```