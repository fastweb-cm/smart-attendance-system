# smart-attendance-system

## Clone the entire repo or smart attendance system app using ssh via
``` git clone git@github.com:fastweb-cm/smart-attendance-system.git ```

## Setup your env
* The central server backend app is built using PHP, and inorder to get it running, you are expected to setup a virtual host.
* After setting up the virtual host, you will realise most of the dir or should i say apps needs an env file and there's anready an .env.example file, create an .env file and copy the content from the .env.example and paste in there accordingly.
* Update the env file to reflect your env, ie if your central server api is running on http://smartattendance.com, your NEXT_PUBLIC_BASE_URL in the central-server/admin-frontend env should reflect that, an so on.

## Install dependencies for the terminal app and the central server app
``` make central-dev ```
``` make terminal-dev```
### This will install all frontend dependencies for the two apps and spin up the apps respectively.

## You can as well run either apps given all dependencies are already installed or without necessarily running npm install using the make commands below
``` make central-run ```
``` make terminal-run ```
