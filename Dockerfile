# syntax=docker/dockerfile:1

# Stage 1: Build React app
FROM node:20 AS build

WORKDIR /app/assets

# Copy necessary files and install dependencies
COPY assets/package*.json ./
COPY assets/tsconfig*.json ./
COPY assets/vite.config.ts ./
RUN yarn install --quiet

# Copy the entire frontend source code
COPY assets/ ./

# Build the frontend
RUN yarn build

# Stage 2: Build Elixir and combine with React build
FROM elixir:1.17.2-otp-27

# Define the argument for the build mode and set a default value
ARG BUILD_MODE=prod
ARG DATABASE_URL
ARG SECRET_KEY_BASE
ARG PHX_HOST

WORKDIR /app

# Copy the Phoenix source files
COPY . .

# Copy the React build from the previous stage
COPY --from=build /app/assets/dist /app/priv/static/front

# Set the environment to production
ENV MIX_ENV=${BUILD_MODE}
ENV DATABASE_URL=${DATABASE_URL}
ENV SECRET_KEY_BASE=${SECRET_KEY_BASE}
ENV PHX_HOST=${PHX_HOST}

# Install Elixir dependencies and compile
RUN mix local.hex --force && \
    mix local.rebar --force && \
    mix deps.get && \
    mix compile

# Expose the Phoenix port
EXPOSE 4000

# Start the Phoenix server
CMD ["mix", "phx.server"]