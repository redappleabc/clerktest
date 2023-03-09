import "reflect-metadata";
import { createConnection } from "typeorm";
import * as express from "express";
import * as bodyParser from "body-parser";
import * as stripe from "stripe";

const app = express();
app.use(bodyParser.json());

createConnection()
  .then(async (connection) => {
    console.log("Connected to database");

    const Contact = connection.getRepository("Contact");

    app.get("/contacts", async (req, res) => {
      const contacts = await Contact.find();
      res.json({ contacts });
    });

    app.post("/connect", async (req, res) => {
      const stripeApi = new stripe(process.env.STRIPE_SECRET_KEY);
      const customers = await stripeApi.customers.list({ limit: 10 });

      let count = 0;
      for (const customer of customers.data) {
        const contact = await Contact.findOne({ email: customer.email });
        if (!contact) {
          await Contact.save({
            name: customer.name,
            email: customer.email,
            phone: customer.phone,
          });
          count++;
        }
      }

      res.json({ message: `Imported ${count} contacts from Stripe API.` });
    });

    app.listen(3000, () => {
      console.log("Server running on port 3000");
    });
  })
  .catch((error) => console.log(error));
