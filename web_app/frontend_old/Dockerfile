FROM node:18-alpine AS build

WORKDIR /app

# Install Yarn on Alpine and install deps using the lockfile
RUN apk add --no-cache yarn

COPY package.json yarn.lock ./

# Use BuildKit cache mount for faster rebuilds
# This caches yarn dependencies between builds
RUN --mount=type=cache,target=/root/.yarn \
    YARN_CACHE_FOLDER=/root/.yarn yarn install --frozen-lockfile --no-optional --network-timeout 600000 \
    && yarn cache clean

COPY . .

ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=${REACT_APP_API_URL}
ARG REACT_APP_PRIVY_APP_ID
ENV REACT_APP_PRIVY_APP_ID=${REACT_APP_PRIVY_APP_ID}
ARG REACT_APP_PRIVY_CLIENT_ID
ENV REACT_APP_PRIVY_CLIENT_ID=${REACT_APP_PRIVY_CLIENT_ID}

RUN yarn build

FROM nginx:alpine

COPY --from=build /app/build /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
