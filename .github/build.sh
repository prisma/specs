mkdir public

# CLI
cd cli
npm install
npm run build
cp -r public ../public/cli
cd ..
