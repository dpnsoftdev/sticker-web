FROM node:22-slim

# Create app directory
WORKDIR /usr/src/app

# Copy package.json and yarn.lock
COPY package.json yarn.lock ./

# Install dependencies using Yarn (from yarn.lock)
RUN corepack enable \
  && yarn install --frozen-lockfile

# Bundle app source
COPY . .

# Build TypeScript
RUN yarn build

EXPOSE 8081

CMD ["yarn", "start"]
