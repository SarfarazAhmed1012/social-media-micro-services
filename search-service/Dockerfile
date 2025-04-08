# using the official node.js 18 image with alpine linux as the base image

FROM node:18-alpine

# set the working directory inside the container
WORKDIR /user/src/app

# copy the package.json and package-lock.json files to the container
COPY package*.json ./

# install dependencies (production check will avoid installing dev dependencies)
RUN npm ci --only=production 

# copy the rest of the application code to the container
COPY . .

# expose port 3004
EXPOSE 3004

# start the application
CMD [ "node", "src/server.js" ]