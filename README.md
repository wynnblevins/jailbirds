# About
This project scrapes the Henrico jail roster webpage, creates "Jailbird" records in a Mongo Atlas db, and posts the results to instagram.

## Setup
In order to run this project, you need to have PM2 installed globally on your machine.  You can install PM2 by running `yarn global add pm2`. 

You will also need to set the Mongo Atlas variables inside the .env file located in the root of the project. 

## To Run
To start the project running locally first pull down node modules by running `yarn install`.  Next, run `yarn build` to compile the typescript code.  Finally, run `pm2 start out/app.js`.  You now will have the jailbirds code running within a pm2 process in the background. You can list the running pm2 processes to verify the jailbirds code is running by executing `pm2 list`.