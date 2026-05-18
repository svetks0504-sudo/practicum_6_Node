import sequelize from "./db.js";
import "../models/index.js"

async function syncDatabase() {
    try{
        await sequelize.authenticate();
        console.log("database connebted");

        await sequelize.sync({force: true});
        console.log("All tables created");

        process.exit();
    } catch(error){
        console.log("Error:", error)
    }
}

syncDatabase();