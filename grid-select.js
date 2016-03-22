angular
  .module('io.rednet.grid-select', [])
  .provider('gridSelect', GridSelectProvider)
  .directive('gridSelect', gridSelectFactory);

GridSelectProvider.$inject = [];
function GridSelectProvider () {
  var opts = {
    cellWidth: 20,
    cellHeight: 20,
    cellMargin: 3,
    cellBackground: '#333',
    cellBorderWidth: 1
  };

  var provider = this;

  this.cellWidth       = getterSetter('cellWidth');
  this.cellHeight      = getterSetter('cellHeight');
  this.cellMargin      = getterSetter('cellMargin');
  this.cellBorder      = getterSetter('cellBorder');
  this.cellBackground  = getterSetter('cellBackground');
  this.cellBorderWidth = getterSetter('cellBorderWidth');

  this.$get = [function () {
    return {
      cellWidth: getter('cellWidth'),
      cellHeight: getter('cellHeight'),
      cellMargin: getter('cellMargin'),
      cellBorder: getter('cellBorder'),
      cellBackground: getter('cellBackground'),
      cellBorderWidth: getter('cellBorderWidth')
    };
  }];

  function getter (prop) {
    return function () {
      return opts[prop];
    };
  }

  function getterSetter (prop) {
    return function (val) {
      if (val == null) {
        return opts[prop];
      }

      opts[prop] = val;

      return provider;
    };
  }
}

gridSelectFactory.$inject = ['gridSelect'];
function gridSelectFactory (gridSelect) {
  var WIDTH  = gridSelect.cellWidth();
  var HEIGHT = gridSelect.cellHeight();
  var MARGIN = gridSelect.cellMargin();
  var DPR    = window.devicePixelRatio || 1;

  return {
    restrict: 'E',
    template: '<canvas>',
    bindToController: { rows: '@?', cols: '@?' },
    scope: {},
    controllerAs: 'grid',
    controller: GridSelectController,
    link: postLink,
    require: 'ngModel'
  };

  function postLink (scope, elem, attr, ngModel) {
    var canvas = elem[0].querySelector('canvas');
    var rect   = canvas.getBoundingClientRect();
    var width  = scope.grid.cols * (WIDTH + MARGIN) + MARGIN;

    scope.grid.model   = ngModel;
    scope.grid.ctx     = canvas.getContext('2d');

    canvas.style.width = width + 'px';
    canvas.width       = DPR * width;
    canvas.height      = DPR * scope.grid.rows * (HEIGHT + MARGIN) + MARGIN;
    ngModel.$render    = scope.grid.render;

    // TODO: debounce the mousemove event
    elem.on('mousemove', mousemove);
    elem.on('mouseout', mouseout);
    elem.on('click', click);

    function mousemove (e) {
      scope.grid.cursor = getPos(e);
      ngModel.$render();
    }

    function mouseout () {
      scope.grid.cursor = null;
      ngModel.$render();
    }

    function click (e) {
      ngModel.$setViewValue(getPos(e));
      mouseout();
    }

    function getPos(e) {
      return {
        rows: 1 + Math.floor((e.clientY - rect.top - MARGIN) / (HEIGHT + MARGIN)),
        cols: 1 + Math.floor((e.clientX - rect.left - MARGIN) / (WIDTH + MARGIN))
      };
    }
  }
}

function GridSelectController (gridSelect) {
  var STROKE = gridSelect.cellBorder();
  var FILL   = gridSelect.cellBackground();
  var WIDTH  = gridSelect.cellWidth();
  var HEIGHT = gridSelect.cellHeight();
  var MARGIN = gridSelect.cellMargin();
  var LINE   = gridSelect.cellBorderWidth();
  var DPR    = window.devicePixelRatio || 1;

  var grid = this;

  grid.rows = grid.rows || 5;
  grid.cols = grid.cols || 5;
  grid.render = render;

  function render () {
    var cols, rows, col, row;

    if (grid.cursor) {
      cols = grid.cursor.cols;
      rows = grid.cursor.rows;
    } else {
      cols = grid.model.$viewValue.cols || 0;
      rows = grid.model.$viewValue.rows || 0;
    }

    grid.ctx.clearRect(0, 0, grid.ctx.canvas.width, grid.ctx.canvas.height);
    grid.ctx.fillStyle   = FILL;
    grid.ctx.lineWidth   = LINE;

    for (row = 0; row < grid.rows; row = row + 1) {
      for (col = 0; col < grid.cols; col = col + 1) {
        grid.ctx.fillRect(
          DPR * (MARGIN + col * (WIDTH + MARGIN)),
          DPR * (MARGIN + row * (HEIGHT + MARGIN)),
          DPR * WIDTH,
          DPR * HEIGHT
        );

        if (col < cols && row < rows) {
          continue;
        }

        grid.ctx.clearRect(
          DPR * (MARGIN + col * (WIDTH + MARGIN)) + LINE,
          DPR * (MARGIN + row * (HEIGHT + MARGIN)) + LINE,
          DPR * WIDTH - LINE * 2,
          DPR * HEIGHT - LINE * 2
        );
      }
    }
  }
}
