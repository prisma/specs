mkdir public

# CLI
cd cli
npm install
npm run build
cp -r public ../public/cli
cd ..

# Prisma Schema
# mkdir -p public/prisma-schema
# npx spec-md prisma-schema/Readme.md > public/prisma-schema/index.html
