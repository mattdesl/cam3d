## running the demos

First install the necessary 
```
npm install beefy -g
npm install browserify -g
```

Then run the app: 
```
beefy simple.js --cwd demos --live -- -r './lib/index.js:cam3d'
```