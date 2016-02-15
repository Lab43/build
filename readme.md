# Build Process

This site is built with a custom static site generator which will one day (hopefully) evolve into Underdot. The generator uses node.js, so you'll need to install node and run `npm install` to install dependencies.

To build the site once run `node index.js`.

To have the site automatically rebuild whenever changes are detected install Nodemon then simply run `nodemon` from inside the root directory.


# Deployment

The site is set up to be deployed to Github pages, but that's actually not where it's being hosted. Still, you may still wish to deploy to Github for testing. Commit your changes to the master branch then run the command `git subtree push --prefix build origin gh-pages` to deploy the build directory to the gh-pages branch. The site will be available at http://abreu.gh.l43.co.


# Passwords

### Hostgator Control Panel

* URL: https://gator4197.hostgator.com:2083/
* Username: abreu
* Password: Bks3bmBx1&el

### FTP

* Server: 108.167.181.190
* Username: abreu
* Password: Bks3bmBx1&el

## Hover

* Username: abreu
* Password: Madron@ranch86
