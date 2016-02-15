var rrd = require('recursive-readdir')
  , path = require('path')
  , fs = require('fs-extra')
  , fm = require('front-matter')
  , _ = require('underscore')
  , markdown = require('markdown').markdown
  , swig = require('swig')
  , less = require('less')
;

rrd('source', ['.DS_Store'], function (err, paths) {
  if (err) throw (err);

  // sort files by type
  paths = _.groupBy(paths, function (sourcePath) {
    var filename = path.basename(sourcePath)
      , extension = path.extname(sourcePath)
    ;
    if (filename[0] === '_' && extension === '.html') {
      return 'templates';
    }
    if (filename[0] === '_') {
      return 'ignore';
    }
    if (extension === '.html' || extension === '.md') {
      return 'pages';
    }
    if (extension === '.less') {
      return 'less';
    }
    return 'static';
  });

  // prep templates
  var templates = {}
  paths.templates.forEach(function (filePath) {
    templates[getCleanPath(filePath)] = loadTextFile(filePath);
  });

  // render pages
  paths.pages.forEach(function (filePath) {
    var page = loadTextFile(filePath);
    // render markdown
    if (path.extname(filePath) === '.md') {
      page.locals.body = markdown.toHTML(page.locals.body);
    }
    // render swig for this page
    page.locals.body = swig.render(page.locals.body, page);
    // pass to template(s)

    fs.mkdirsSync(path.join('build', page.locals.path));
    fs.writeFileSync(path.join('build', page.locals.path, 'index.html'), renderPage(page));
  })

  // render less
  if (paths.less) {
    paths.less.forEach(function (filePath) {
      var lessFile = fs.readFileSync(filePath, {encoding: 'utf8'});
      fs.mkdirsSync(path.join('build', getCleanDir(filePath)));
      less.render(lessFile, function (err, output) {
        if (err) console.log(err);
        if (err) throw (err);
        fs.writeFileSync(path.join('build', getCleanPath(filePath) + '.css'), output.css);
      });
    });
  }

  if (paths.static) {
    paths.static.forEach(function (filePath) {
      fs.mkdirsSync(path.join('build', getCleanDir(filePath)));
      var newFilePath = filePath.split('/');
      newFilePath[0] = 'build';
      newFilePath = newFilePath.join('/')
      fs.copySync(filePath, newFilePath);
    });
  }

  // copy static files

  function renderPage(page) {
    var templateName = findNextTemplate(page.template);
    var template = templates[templateName];
    var body = swig.render(template.locals.body, page)
    if (template.template) {
      var nextStep = {
        template: template.template,
        locals: _.clone(page.locals),
      }
      nextStep.locals.body = body;
      _.defaults(nextStep.locals, template.locals);
      return renderPage(nextStep);
    }
    return body;
  }

  function findNextTemplate(templateName) {
    if (templates[templateName]) return templateName;
    var parts = templateName.split('/');
    if (parts.length <= 1) throw new Error('Template ' + templateName + ' cannot be found');
    parts.splice(parts.length - 2, 1);
    return findNextTemplate(parts.join('/'));
  }

});

function loadTextFile(filePath) {
  var file = fs.readFileSync(filePath, {encoding: 'utf8'});
  var matter = fm(file);
  var data = {
    filePath: filePath,
    locals: matter.attributes,
  };
  data.locals.path = getCleanPath(filePath)
  data.locals.body = matter.body;
  data.template = resolveTemplatePath(data.locals.path, data.locals.template);
  delete data.locals.template;
  if (typeof data.template === 'undefined') delete data.template;
  return data;
}

function getCleanPath(filePath) {
  // source/path/to/thing.html -> path/to/thing
  var parts = filePath.slice(7).split('.')[0].split('/');
  if (_.last(parts) === 'index') parts.pop();
  return parts.join('/');
}

function getCleanDir(filePath) {
  return path.dirname(filePath.slice(7));
}

function resolveTemplatePath(pagePath, requestedTemplate) {
  var dir = path.dirname(pagePath);
  // this page has a specified template, so look for it in the current directory
  if (requestedTemplate) {
    return path.join(dir, '_' + requestedTemplate);
  }
  // this page does not have a specified template, and is not a default template (_.html), so look for the default template (_.html) in the current directory
  if (pagePath.slice(-1)[0] !== '_') {
    return path.join(dir, '_');
  }
  // this page is a default template (_.html) so look for the default template (_.html) in the parent directory, unless there is no parent directory
  if (pagePath.split('/').length > 1) {
    return path.join(pagePath.split('/').slice(0, -1).push('_'));
  }
}
