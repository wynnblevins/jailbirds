# About
This project scrapes the Henrico jail roster webpage, creates "Jailbird" records in a Mongo Atlas db, and posts the results to instagram.

## Setup
In order to run this project, you need to have PM2 installed globally on your machine.  You can install PM2 by running `yarn global add pm2`. 

You will also need to set the Mongo Atlas variables inside the .env file located in the root of the project. 

### Extra Steps For Ubuntu Linux
If you're running on Ubuntu Linux, you may get an error which states, that there is "No Usable Sandbox" and that "If you want to live dangerously and need an immediate workaround, you can try using --no-sandbox."

IMPORTANT NOTE: The Linux SUID sandbox is almost but not completely removed. See https://bugs.chromium.org/p/chromium/issues/detail?id=598454 This section is mostly out-of-date.

The setuid sandbox comes as a standalone executable and is located next to the Chrome that Puppeteer downloads. It is fine to re-use the same sandbox executable for different Chrome versions, so the following could be done only once per host environment:

#### cd to Puppeteer cache directory (adjust the path if using a different cache directory).
```sh
cd ~/.cache/puppeteer/chrome/linux-<version>/chrome-linux64/
sudo chown root:root chrome_sandbox
sudo chmod 4755 chrome_sandbox
```
#### copy sandbox executable to a shared location
```sh
sudo cp -p chrome_sandbox /usr/local/sbin/chrome-devel-sandbox
```
#### export CHROME_DEVEL_SANDBOX env variable
```sh
export CHROME_DEVEL_SANDBOX=/usr/local/sbin/chrome-devel-sandbox
```
You might want to export the CHROME_DEVEL_SANDBOX env variable by default. In this case, add the following to the ~/.bashrc or .zshenv:
```sh
export CHROME_DEVEL_SANDBOX=/usr/local/sbin/chrome-devel-sandbox
```

## To Run
To start the project running locally first pull down node modules by running `yarn install`.  Next, run `yarn build` to compile the typescript code.  Finally, run `pm2 start out/app.js`.  You now will have the jailbirds code running within a pm2 process in the background. You can list the running pm2 processes to verify the jailbirds code is running by executing `pm2 list`.

## To Run Tests
You can run tests by running `yarn test`.

## To Trigger A Manual Batch Posting
You can run the posting routine manually by running `yarn startManualBatch`.

## To Manually Post A Jailbird
You can also opt to manually post a jailbird by their ID number.  In order to do this, obtain the inmate ID from the jailbird's specific jailbird document in mongo and run `yarn manuallyPost 123456` where "123456" is the ID of the inmate you'd like to see posted.