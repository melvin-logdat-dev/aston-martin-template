

# Aston Martin Email Template

This template uses MJML as core.

---
<br/>

## To get started

Run in terminal: ```yarn && yarn build && yarn dev``` or ```npm install && npm run build && npm run dev```

Install live server VS code extension to preview changes:

[Live Server extension](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer)

Once installed go to `localhost:5500/index.html` or `http://127.0.0.1:8181/` to view other variants

<br/>

## Creating other variants

On `/variants` folder create a new folder together with a new JSON file that contains the name of the components inside the `/components` folder.

Sample JSON file:

```
{
 "name": "brickline",
 "content": [
  {
    "template" : "header-compatibility.mjml",
    "variables" : {
      "text" : "Email not displaying correctly?",
      "linkText" : "View in Browser",
      "link" : "#"
    }
  }
 ],
 "dateModified": "2022-08-04T01:49:12.384Z"
}
```

<br/>

## Email testing with nodemailer

Copy `.env.example` and rename it to `.env`. Change the variables as needed with your own gmail account

In terminal run
`yarn test` or `npm run test`
with the following flags `-v` for variant name and `-t` for recipient's email address.

Example:

```
yarn test -v _full-example-1 -t andrei.mari.trinidad@codeandtheory.com
```

This will send a test email.

<br/>

## Email Testing with Emailonacid

To help aid in email testing platforms that need asset files available publicly, any file pushed to the `main` branch of this repo that is located in directory:

`/images/*`

<br/>

## Useful link(s)

[MJML documentation](https://documentation.mjml.io/)
