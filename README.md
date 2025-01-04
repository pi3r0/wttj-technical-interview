# Wttj
## Table of contents
1. [Description](#description)
2. [Requirements](#requirements)
3. [Getting Started](#getting-started)
    - Setup Database
    - Run Phoenix server
    - Run React app
4. [Tests](#tests)
5. [Learn more](#learn-more)

## Description
Job technical interview test for a Engineer manager hands on at welcome to the jungle.\
This project is phoenix based app with react powered front.\
Follow the [getting started](#getting-started) process to be able to run it properly.

## Requirements
- Elixir 1.17.2-otp-27
- Erlang 27.0.1
- Postgresql
- Nodejs 20.11.0
- Yarn

## Getting started
### Setup database
To run this project, you will need to postgres instance up and running.\
If you don't have this, create a local docker image
```bash 
docker run
    --name wttj_postgres_db \
    -p 5432:5432 \
    -e POSTGRES_USER=postgres \
    -e POSTGRES_PASSWORD=postgres \
    -e POSTGRES_DB=wttj_local \
    -d postgres
```
### Run Phoenix server

To start your Phoenix server:
First you need to run migration and setup dependencies
```bash
  mix setup
```

then run the server 
```bash
  mix phx.serve
```

### Run react app
Open in a separated terminal window
- Go to react repo in `/assets`
```bash 
cd assets
```

- Install dependencies
```bash 
yarn
```

- Run
```bash 
yarn dev
```

Now you can visit [`localhost:4000`](http://localhost:4000) from your browser.

## tests

- backend: `mix test`
- front: `cd assets & yarn test`


Ready to run in production? Please [check our deployment guides](https://hexdocs.pm/phoenix/deployment.html).

## Works 
All requirements will be detailed in separate pull request. 

## Learn more

- Official website: https://www.phoenixframework.org/
- Guides: https://hexdocs.pm/phoenix/overview.html
- Docs: https://hexdocs.pm/phoenix
- Forum: https://elixirforum.com/c/phoenix-forum
- Source: https://github.com/phoenixframework/phoenix