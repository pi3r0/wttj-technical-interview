# Wttj
## Table of contents
1. [Description](#description)
2. [Requirements](#requirements)
3. [Getting Started](#getting-started)
   1. Setup Database
   2. Run Phoenix server
   3. Run React app
4. [Tests](#tests)
5. [Works](#works)
   1. Basic Functionality
6. [Learn more](#learn-more)

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
docker run \
    --name wttj_postgres_db \
    -p 5432:5432 \
    -e POSTGRES_USER=postgres \
    -e POSTGRES_PASSWORD=postgres \
    -e POSTGRES_DB=wttj_local \
    -d postgres
    
    
    docker run wttj_test_docker \
    -p 4000:4000 \
    
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

Now you can visit [`localhost:4000`](http://localhost:5173) from your browser.

### Docker
You can run directly with a docker image

1. Build
`SECRET_KEY_BASE`: select your secret
`DATABASE_URL`: postgres access, exemple for a local database`postgres:postgres@host.docker.internal:5432/wttj_local`
`PHX_HOST`: host exemple 0.0.0.0 for local

```bash 
docker build -t wttj_docker_app . \    
  --build-arg SECRET_KEY_BASE=#YOU_SECRET_HERE# \
  --build-arg DATABASE_URL=#DATABASE_URL# \
  --build-arg PHX_HOST=#HOST
```

2. Run
Run with

```bash
docker run -p 4000:4000 wttj_docker_app
```

## tests

- backend: `mix test`
- front: `cd assets & yarn test`


Ready to run in production? Please [check our deployment guides](https://hexdocs.pm/phoenix/deployment.html).

## Works 
All requirements will be detailed in separate pull request.

### Basic Functionality
This task will separate in two user stories, you can follow detail on each Pull request

| US #id                                                        | Name                        | Desc                                                                                              | Requirements                                                                                                                                                  |
|---------------------------------------------------------------|-----------------------------|---------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------|
| [1](https://github.com/pi3r0/wttj-technical-interview/pull/1) | Update status               | As User, I could update the candidate status by drag and drop the card into another status column | - stored and saved updates (<b>Must Have</b>)<br/>- Highlighted card destination (<b>Nice to have</b>)                                                        |
| [2](https://github.com/pi3r0/wttj-technical-interview/pull/3) | Update priority             | As User, I could update the candidate priority by drag and drop the card into same status column  | - stored and saved updates (<b>Must Have</b>)<br/>- Highlighted card destination (<b>Nice to have</b>)                                                        |
| [3](https://github.com/pi3r0/wttj-technical-interview/pull/4) | Add real time collaboration | As User, i should receive updates from other users connected                                      | - display updates without refresh (<b>Must Have</b>)<br/>- handle concurrency issues on updates (<b>Must Have</b>)<br/>- display updates (<b>Nice to have</b> |
| [4](https://github.com/pi3r0/wttj-technical-interview/pull/5) | Add Pagination              | As User, i should be able to fetch candidate not loaded                                           | - add pagination (<b>Must Have</b>)<br/>- add virtualisation (<b>Must Have</b>)<br/> - add caching optimisation (<b>Nice to have</b>                          |

## Learn more

- Official website: https://www.phoenixframework.org/
- Guides: https://hexdocs.pm/phoenix/overview.html
- Docs: https://hexdocs.pm/phoenix
- Forum: https://elixirforum.com/c/phoenix-forum
- Source: https://github.com/phoenixframework/phoenix