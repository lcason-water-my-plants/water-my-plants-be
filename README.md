>To connect to Mongo DB with Compass:
    >Open Terminal> mongod
    >Open  NEW Terminal Window > mongo
    >Mongo Server should be running in the background on local host 27017 which is the default
    >Open Compass
    >On the left side click New Connection
    >Click connect, it will show all the DB we have locally on the computer (show dbs will show you all dbs in termianl)

>Creating a HOSTED database with Atlas:
    >Open browser and go to > https://account.mongodb.com/account/login?nds=true
    >Drop down box on left and create a new project
    >Name it and click create
    >Create Cluster with default cluster for free
    >After cluster loads(takes a minute) connect to the new DB
>Connecting the MongoShell to the App
    >Click CONNECT left side under 'cluster'
        >Add your current IP address button adds IP automatically
        >create a username and autogenerate the password(you'll be adding this to your config file under DATABASE_PASSWORD), you'll also need it in the next step.
    >Connect using MongoDB Compass
        >I have MongoDB Compass
            >Version 1.12 or later
        >Copy Connection String and open MongoDB Compass
        >Open MongoDB Compass
        >New Connection
        >Paste Connection String from Atlas and Click connect
        >You will then create a document
        >You can then add items to the db
    >Allow access to all IP addresses
        >In Atlas
        >Clusters > Security >Network Access
        > + Add IP address
        >Allow access from Anywhere /Confirm (DO NOT DO THIS IF THE INFORMATION IS SENSITIVE)
>Connect Cluster to Mongo Shell
    >Cluster
    >Connect
    >Connect with Mongo Shell
    >Copy connection String
    >Quit Mongo shell if it's running.. quit()
    >Paste Connection String
    >Paste PW out of config file
    >show dbs to see if your dbs show up
    >To get into your DB you need to type> use dbnamegoeshere and it should show that it's switched.
    >db.collection.find() will show you all items in that collection ex: db.plants.find()

>Connecting DB to Express App(using Mongose)
    >In Atlas
    >Click CONNECT
    >Connect your application (make sure Node.js is in the box)
    >In Config file, the DATABASE variable will be your connection string
    >make sure to to replace the <password> section to <PASSWORD> so the code in the server.js file will run correctly.
    >make sure to replace 'test' with the database name ex: 'watermyplants'
    >Install Mongoose npm i mongoose