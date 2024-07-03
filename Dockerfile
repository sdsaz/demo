#Download Node Alpine image
FROM node:16.14-alpine As build

#Setup the working directory
WORKDIR /app

#Copy package.json
COPY package.json ./


#Install dependencies
RUN npm install --legacy-peer-deps

#Copy other files and folder to working directory
COPY . .

#Build Angular application in QA mode
RUN npm run build --prod
#RUN npm run ng --build --configuration production

#Download NGINX Image
FROM nginx:1.15.8-alpine
COPY nginx.conf /etc/nginx/nginx.conf

#Copy built angular files to NGINX HTML folder
COPY --from=build /app/dist /usr/share/nginx/html
