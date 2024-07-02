import { createRequire } from "module";
const require = createRequire(import.meta.url);
import mjml2html from 'mjml';
const fs = require('fs');
import path, { join } from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import pkg from 'handlebars';
const { compile } = pkg;

function readFromFile(file, getText = true) {
  return new Promise((resolve, reject) => {
    fs.readFile(file, function (err, data) {
      if (err) {
        console.log(err);
        reject(err);
      } else {
        let _data;
        if (getText) {
          _data = data.toString();
        } else {
          _data = JSON.parse(data);
        }
        resolve(_data);
      }
    });
  });
}

function getVariants() {
  return new Promise((resolve, reject) => {
    fs.readdir(path.resolve(__dirname, '../../variants'), (err, files) => {
      if (err) {
        console.log(err);
        reject(err);
      }
      let variants = [];
      files.forEach(async (file) => {
        const directory = `../../variants/${file}`;
        const JSONFile = directory + `/${file}.json`;
        const stat = fs.statSync(path.resolve(__dirname, directory));
        if (stat.isFile()) return;
        const creationDate = stat.birthtime;
        const modifiedDate = stat.mtime;
        variants.push({ JSONFile, creationDate, modifiedDate });
      });
      resolve(variants);
    });
  });
}

const getTemplate = async () => {
  let template = await getVariants();
  let promises = [];
  template.forEach(({ JSONFile }) => {
    promises.push(readFromFile(path.resolve(__dirname, JSONFile), false));
  });
  const _template = await Promise.all(promises);
  return _template.map((tmpl, index) => ({
    ...tmpl,
    creationDate: template[index].creationDate,
    modifiedDate: template[index].modifiedDate
  }));
};

// per template generator
const generateTemplate = (fileName = 'index', template = [], showComponentName = false) => {
  let promises = [];

  // get index file
  promises.push(readFromFile(path.resolve(__dirname, '../global/' + 'index.mjml')));
  template.forEach(dir => {
    let tmplText = fs.readFileSync(path.resolve(__dirname, '../components/' + dir.template), 'utf8');
    const templateFile = compile(tmplText);
    const compiled = templateFile(dir.variables);
    promises.push(compiled);
  });

  Promise.all(promises).then(result => {
    let output = '';
    const header = result[0].split('<!-- split -->')[0];
    const footer = result[0].split('<!-- split -->')[1];

    // inject header
    output += header;

    // get each component
    result.shift(); // removes first component since it contains the header and footer
    result.forEach((res, i) => {
      if (showComponentName) {
        output += `
          <mj-section>
            <mj-column padding="10px">
              <mj-text color="black" align="center">${template[i]}</mj-text>
            </mj-column>
          </mj-section>
        `;
      }
      output += res;
    });

    // insert footer
    output += footer;

    // relocate component styles into head
    const headStyles = output.matchAll(/\/\* START\: head\-styles \*\/([^\<]+)\/\* END\: head\-styles \*\//g);

    for (const headStyle of headStyles) {
      // add to head
      output = output.replace('/* RELOCATE: head-styles */', '\n' + headStyle[1] + '\n/* RELOCATE: head-styles */');
      // remove from body
      output = output.replace(headStyle[0], '');
    }

    // generate HTML output
    const htmlOutput = mjml2html(output, { keepComments: true });

    // write the MJML file
    fs.writeFile(path.resolve(__dirname, `../../variants/${fileName}/${fileName}.mjml`), output, 'utf8', function (err) {
      if (err) return console.log(err);
      console.log(`Variant ${fileName} generated!`);
    });

    // write the HTML file
    fs.writeFile(path.resolve(__dirname, `../../variants/${fileName}/${fileName}.html`), htmlOutput.html, 'utf8', function (err) {
      if (err) return console.log(err);
      console.log(`Output for ${fileName} generated!`);
    });
  });
};

// generate all templates and also create index.html as well
const generateTemplatesIndex = async () => {
  const template = await getTemplate();

  const _package = require('./../../package.json');
  let indexHTML = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Email Templates</title>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/picnic">
      <link rel="stylesheet" href="/src/css/global.css">
    </head>
    <body>
      <div class ="template-header">
         <h1 class="package-name">${_package.name}</h1>
         <div class="package-border-line"></div>
      </div>
      <div class="package-label">${_package.description}</div>
      <ul class="template-list">
  `;

  console.log('Generating templates...', template.map(template => template.name));

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  template.sort((a, b) => b.creationDate - a.creationDate).forEach(({ name, content, showComponentName, creationDate, modifiedDate }) => {
    const creationDateOnly = new Date(creationDate);
    creationDateOnly.setHours(0, 0, 0, 0);

    const modifiedDateOnly = new Date(modifiedDate);
    modifiedDateOnly.setHours(0, 0, 0, 0);

    let className = '';

    if (creationDateOnly.getTime() === today.getTime()) {
      className = 'new';
    } else if (modifiedDateOnly.getTime() === today.getTime()) {
      className = 'modified';
    }

    indexHTML += `<li><a href="/variants/${name}/${name}.html" target="_blank" class="${className}">${name}</a><div class="underline"></div></li>`;
    generateTemplate(name, content, showComponentName);
  });

  indexHTML += `
    </ul>
    </body>
  </html>
  `;

  fs.writeFile(path.resolve(__dirname, `../../index.html`), indexHTML, 'utf8', function (err) {
    if (err) return console.log(err);
    console.log('Index HTML generated!');
  });
};

generateTemplatesIndex();
