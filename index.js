angular.module('Rover', [])
  .config(function($provide){
    //setup world
    $provide.value('mapSize', 11);
  })
  .filter('cardinal', function(){
    var dirs = ['N', 'E', 'S', 'W'];
    return function(dir){
      return dirs[dir];
    }
  })
  .controller('Mission', function($scope, TerrainFactory, RoverFactory){
    var vm = this;
    vm.rover = RoverFactory.get(); // sync to shared rover instance
    vm.terrain = TerrainFactory.setup();
    vm.terrain = TerrainFactory.placeRover(vm.rover, vm.terrain);
    vm.attributes = TerrainFactory.cellAttributes;
    vm.moveForward = function(){
      var oldPos = angular.copy(vm.rover.pos);
      var newPos = vm.rover.move();
      vm.terrain = TerrainFactory.moveRover(oldPos, newPos, vm.terrain);
    }
  })
  .factory('RoverFactory', function(){
    var rover = new Rover();
    var factory = {};
    factory.get = function(){return rover;}
    return factory;
  })
  .factory('TerrainFactory', function(mapSize){
    var factory = {};
    factory.cellAttributes = function(cell){
      return mk(cell.obstacle) + 'o,' + mk(cell.rover) + 'r,' + mk(cell.visible) + 'v';
      function mk(val){
        if (!val) {
          return '-'
        }
        return ''
      }
    }
    factory.moveRover = function(old, current, terrain){
      console.log(old, current)
      terrain[old.y][old.x].rover = false;
      terrain[current.y][current.x].rover = true;
      return terrain;
    }
    factory.placeRover = function(rover, terrain) {
      // this operation is more expensive than simply tracking the rover through its movements
      for(var y=0; y < mapSize; y++){
        for(var x=0; x < mapSize; x++){
          terrain[y][x].rover = false;
        }
      }
      terrain[rover.pos.y][rover.pos.x].rover = true;
      return terrain;
    }
    factory.setup = function(map) {
      var terrain = [];
      for(var y=0; y < mapSize; y++){
        row = [];
        for(var x=0; x < mapSize; x++){
          /* go lookup these values in a map file */
          var cell = {
            pos: {x: x, y: y},
            type: 'e',
            obstacle: false,
            damage: 0,
            power: 1,
            visited: false,
            visible: false,
            rover: false
          }
          row[x] = cell;
        }
        terrain[y] = row;
      }
      return terrain;
    }
    return factory;
  })

function Rover() {
  var rover = {
    turn: turn,
    direction: 0,
    move: move,
    pos: {
      x: 5,
      y: 5
    }
  }
  var dirIndex = 0;
  var cardinals = [
    {x: 0, y: -1},  /* north */
    {x: 1, y: 0},  /* west */
    {x: 0, y: 1}, /* south */
    {x: -1, y: 0}  /* east */
  ];
  function move() {
    rover.pos.x += cardinals[dirIndex].x
    rover.pos.y += cardinals[dirIndex].y
    return rover.pos;
  }
  function turn(dir){
    // turn
    if(dir == 'l'){dirIndex--}
    if(dir == 'r'){dirIndex++}

    // wrap
    if(dirIndex>3){dirIndex = 0;}
    if(dirIndex<0){dirIndex = 3;}

    // sync
    rover.direction = dirIndex;
    return dirIndex;
  }
  return rover;
}
