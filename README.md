# Wttj

## Table of Contents
1. [Description](#description)
2. [Requirements](#requirements)
3. [Getting Started](#getting-started)
   1. [Setup Database](#setup-database)
   2. [Run Phoenix Server](#run-phoenix-server)
   3. [Run React App](#run-react-app)
   4. [Run from Docker](#run-docker)
4. [Tests](#tests)
5. [Works](#works)
   1. [Basic Functionality](#basic-functionality)
6. [Learn More](#learn-more)

## Description
This is a job technical interview test for an Engineering Manager role at Welcome to the Jungle.

The project is a Phoenix-based app with a React-powered frontend.  
Follow the [Getting Started](#getting-started) section to run the project locally.

## Requirements
- Elixir 1.17.2-otp-27
- Erlang 27.0.1
- PostgresSQL
- Node.js 20.11.0
- Yarn

## Getting Started

### Setup Database
To run this project, you will need a PostgreSQL instance up and running.  
If you don't have one, you can create a local Docker container:

```bash
docker run \
    --name wttj_postgres_db \
    -p 5432:5432 \
    -e POSTGRES_USER=postgres \
    -e POSTGRES_PASSWORD=postgres \
    -e POSTGRES_DB=wttj_local \
    -d postgres
```

### Run Phoenix Server
To start your Phoenix server, you need to first set up the dependencies and run migrations:
```bash
  mix setup
```

then run the server
```bash
  mix phx.serve
```

if you don't want to run react you can do
```bash
   mix webapp
```
it will build react with latest source and put it directly in the right folder
Now you can visit `localhost:4000` in your browser.

### Run react app
Open a separate terminal window and navigate to the React app in the `/assets` folder:
```bash
  cd /assets
```
Install dependencies
```bash 
yarn
```

And finally run
```bash 
yarn dev
```

Now you can visit `localhost:5173` in your browser.

### Run Docker
You can also run the application directly using Docker.
Don't forget to do migration on the db first with `mix ecto.setup`

1. Build the Docker Image:
Set your environment variables:
`SECRET_KEY_BASE`: Choose your secret key.
`DATABASE_URL`: Example for a local database: `postgres:postgres@host.docker.internal:5432/wttj_local`
`PHX_HOST`: Example for local: 0.0.0.0

```bash
docker build -t wttj_docker_app . \
  --build-arg SECRET_KEY_BASE=#YOUR_SECRET_HERE# \
  --build-arg DATABASE_URL=#DATABASE_URL# \
  --build-arg PHX_HOST=#PHX_HOST
```
quick run for local purpose
```bash 
docker build -t wttj_docker_app . \    
   --build-arg SECRET_KEY_BASE=gqrNUYcQTT1euSJkcTf2iSKBwz9uhmnA5V2XyUoNPUVf2rB0AEbsfy6c0xXg//WA \
   --build-arg DATABASE_URL=postgres:postgres@host.docker.internal:5432/wttj_local \
   --build-arg PHX_HOST=0.0.0.0
```

2. And finally run it
```bash
docker run -p 4000:4000 wttj_docker_app
```

## Tests
- **Backend:** `mix test`
- **Frontend:** `cd assets && yarn test`

## Works

All requirements will be detailed in separate pull requests.

| PR #id                                                                | Name                                     | Type       | Description                                                                                             | Requirements                                                                                                                       | State |
|-----------------------------------------------------------------------|------------------------------------------|------------|---------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------|-------|
| [US #1](https://github.com/pi3r0/wttj-technical-interview/pull/1)      | Update Status                            | User Story | As a User, I should be able to update the candidate status by dragging and dropping the card into another column. | - Store and save updates (<b>Must Have</b>)<br>- Highlight card destination (<b>Nice to have</b>)                                    | ✅     |
| [Chore #1](https://github.com/pi3r0/wttj-technical-interview/pull/2)   | Enable CI/CD                             | Chore      | As a Developer, I need to ensure project coherency and stability.                                          | - Add GitHub pipeline for global testing (<b>Must Have</b>)                                                                        | ✅     |
| [US #2](https://github.com/pi3r0/wttj-technical-interview/pull/3)      | Update Priority                          | User Story | As a User, I should be able to update the candidate priority by dragging and dropping the card in the same column. | - Store and save updates (<b>Must Have</b>)<br>- Highlight card destination (<b>Nice to have</b>)                                    | ✅     |
| [US #3](https://github.com/pi3r0/wttj-technical-interview/pull/5)      | Add Real-Time Collaboration              | User Story | As a User, I should receive updates from other users connected to the system.                              | - Display updates without refresh (<b>Must Have</b>)<br>- Handle concurrency issues on updates (<b>Must Have</b>)                  | ✅     |
| [Chore #2](https://github.com/pi3r0/wttj-technical-interview/pull/7)   | Intro to Optimisation and Scalability    | Chore      | As a User, I should be able to load and continue working even if the candidate list is large.              | - Add pagination (<b>Must Have</b>)<br>- Add virtualisation (<b>Must Have</b>)<br>- Add caching optimisations (<b>Nice to have</b>) | ✅     |
| [Fix #1](https://github.com/pi3r0/wttj-technical-interview/pull/8)     | Update Column Count with Refresh         | Fix        | As a User, I should see the candidate count updated whenever changes are made.                            | - Add column count when fetching the candidate list (<b>Must Have</b>)<br>- Emit event when column count is updated (<b>Must Have</b>) | ✅     |
| [Fix #2](https://github.com/pi3r0/wttj-technical-interview/pull/10)    | Session Management                       | Fix        | As a User, I should not be able to see candidates if I am not "logged in".                               | - Block UI when user is not connected (<b>Must Have</b>)<br>- Fetch data when connected status changes (<b>Must Have</b>)           | ✅     |
| [US #4](https://github.com/pi3r0/wttj-technical-interview/pull/12)    | Add Candidate View                       | User Story | As a User, I should be able to create a new candidate.                                                    | - Add form to create new candidate (<b>Must Have</b>)<br>- Ensure new candidate doesn't already exist (<b>Must Have</b>)            | ✅     |
| [Chore #3](https://github.com/pi3r0/wttj-technical-interview/pull/13)  | Add Dockerfile                           | Chore      | As a Developer, I should be able to run the app from a Docker image.                                       | - Decouple React and Phoenix (<b>Must Have</b>)<br>- Create Dockerfile to build image (<b>Must Have</b>)                             | ✅     |
| [Fix #3](https://github.com/pi3r0/wttj-technical-interview/pull/14)    | Fix Asset URL for Local Environment      | Fix        | As a Developer, I should be able to run React locally.                                                     | - Fix asset location when app is running locally                                                                                   | ✅     |
| [US #5](https://github.com/pi3r0/wttj-technical-interview/pull/16)    | Add Column                               | User Story | As a User, I should be able to create a new column in my job board.                                        | - Add column functionality (<b>Must Have</b>)<br>- Edit column order (<b>Must Have</b>)<br>- Add column flow (<b>Nice to Have</b>)  | 🕥     |

## Learning
I found this Fullstack test to be an incredibly relevant and engaging experience. It was exciting to work on a project that closely mirrors the actual challenges you're solving at your company. This alignment allowed me to gain valuable insights into your day-to-day work and the technologies you use.

The focus on a real-time candidate management system was particularly interesting as it's a feature commonly used in modern products. It showcased the complexities involved in creating intuitive, responsive interfaces for managing dynamic data.

I put significant effort into demonstrating how I approach and resolve product issues. Although the project is not 100% finished (e.g., I would have liked to integrate Cypress for testing), the MVVM pattern I adopted allowed me to test how the page reacts without additional tools. Every step was carefully chosen to strike a balance between perfection and the ability to iterate quickly.

### What I Plan to Do Next:
- Complete the column feature (significant improvement for user experience and further optimization opportunities).
- Add a workflow for production builds.
- Fine-tune session management (potential backend system integration).
- Implement enhanced error management.

While there's always room for improvement, I am proud of what I was able to achieve within the given timeframe. The project’s evolution from concept to implementation was rewarding, and it gave me tangible insights into the innovative solutions your company is creating.

## Learn More
- Official Website: [Phoenix Framework](https://www.phoenixframework.org/)
- Guides: [Phoenix Guides](https://hexdocs.pm/phoenix/overview.html)
- Docs: [Phoenix Documentation](https://hexdocs.pm/phoenix)
- Forum: [Phoenix Forum](https://elixirforum.com/c/phoenix-forum)
- Source: [Phoenix GitHub](https://github.com/phoenix)