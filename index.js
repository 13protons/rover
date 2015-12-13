angular.module('Rover', [])
  .config(function($provide){
    //setup world
    $provide.value('mapSize', 25);

    $provide.value('map', [
      {
        pos: {x: 3, y: 7},
        obstacle: true
      }
    ]);

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
    console.log(vm.terrain);
    vm.terrain = TerrainFactory.placeRover(vm.rover, vm.terrain);
    vm.attributes = TerrainFactory.cellAttributes;
    vm.worldSize = TerrainFactory.worldSize;
    vm.moveForward = function(){
      vm.message = '';
      var updatedTerrain = TerrainFactory.moveRover(vm.terrain, vm.rover);
      if (updatedTerrain) {
        vm.terrain = updatedTerrain;
      } else {
        vm.message = 'bonk'
      }

    }
    $scope.$on('bonk', function(){
      vm.message = 'bonk';
    })
  })
  .factory('RoverFactory', function(mapSize){
    var rover = new Rover(mapSize);
    var factory = {};
    factory.get = function(){return rover;}
    return factory;
  })
  .factory('TerrainFactory', function(mapSize, map){
    var factory = {};

    factory.worldSize = {
      width: (mapSize * 51) + 'px',
      height: (mapSize * 51) + 'px'
    }
    factory.moveRover = function(_terrain, rover){
      //console.log(old, current)
      var terrain = angular.copy(_terrain);
      var old = angular.copy(rover.pos);
      var current = rover.move(terrain);

      if (current) {
        terrain[old.y][old.x].rover = false;
        terrain[current.y][current.x].rover = true;
        return terrain;
      }
      return false;

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
    factory.setup = function() {
      var terrain = [];

      for(var y=0; y < mapSize; y++){
        row = [];
        for(var x=0; x < mapSize; x++){
          /* go lookup these values in a map file */
          var mapCell = {};

          angular.forEach(map, function(val, i){
            if(val.pos.x == x && val.pos.y == y){
              console.log('found an obstacle')
              mapCell = val;
              return false;
            }
          });

          var cell = angular.merge({}, {
            pos: {x: x, y: y},
            type: 'e',
            obstacle: false,
            damage: 0,
            power: 1,
            visited: false,
            visible: false,
            rover: false
          }, mapCell);

          row[x] = cell;
        }
        terrain[y] = row;
      }
      return terrain;
    }
    return factory;
  })

function Rover(size) {
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
  function move(terrain) {
    var currentPos = angular.copy(rover.pos);

    rover.pos.x += cardinals[dirIndex].x
    rover.pos.y += cardinals[dirIndex].y

    // wrap to world
    if (rover.pos.x > size -1) {rover.pos.x = 0;}
    if (rover.pos.y > size -1) {rover.pos.y = 0;}

    if (rover.pos.x < 0) {rover.pos.x = size -1;}
    if (rover.pos.y < 0) {rover.pos.y = size -1;}

    // test for sollision
    if (terrain[rover.pos.y][rover.pos.x].obstacle){
      rover.pos = currentPos;
      return false;
    }

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
