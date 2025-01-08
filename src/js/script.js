import { Vector2 } from './Vector2.js';
import { Pill } from './Pill.js';
import { Circle } from './Circle.js';
import { Rectangle } from './Rectangle.js';
import * as Collision from './Collision.js';
import * as Resolver from './Resolver.js';
import { SpatialHashGrid } from './SpatialHashGrid.js';

function main() {
  const canvas = document.getElementById('canvas');
  const playBtn = document.getElementById('play-btn');
  const pauseBtn = document.getElementById('pause-btn');
  const restartBtn = document.getElementById('restart-btn');
  const wireframeBtn = document.getElementById('wireframe-btn');
  const contactsBtn = document.getElementById('contacts-btn');
  const gridBtn = document.getElementById('grid-btn');
  const aabbBtn = document.getElementById('aabb-btn');

  const ctx = canvas.getContext('2d');
  const width = 400;
  const height = 640;
  const pixelDensity = Math.round(devicePixelRatio);

  const subSteps = 8;
  const gravity = new Vector2(0, 9.81);
  let isSimulating = false;
  let simulationId = null;
  let deltaTime = 0;

  const bodies = [];
  const restitution = 0.8;
  const maxSize = 40;
  const minSize = 30;
  let wireframe = false;
  let isRenderContactPoints = false;
  let isRenderAABBs = false;
  let isRenderGrid = false;
  const contactPointColor = '#f9ab1574';
  const aabbColor = '#f9ab156d';
  const groundRect = new Rectangle(width / 2, height * 0.9, 300, 200, {
    isStatic: true,
    wireframe
  });

  const spatialGrid = new SpatialHashGrid(0, 0, width, height, maxSize);

  /* 
  const imgBall = {
    image: new Image(),
    isLoaded: false
  };
  imgBall.image.src = '../../assets/ball.png';
  imgBall.image.onload = () => (imgBall.isLoaded = true);

  const imgBox = {
    image: new Image(),
    isLoaded: false
  };
  imgBox.image.src = '../../assets/box.jpg';
  imgBox.image.onload = () => (imgBox.isLoaded = true);

  const imgPill = {
    image: new Image(),
    isLoaded: false
  };
  imgPill.image.src = '../../assets/pill.png';
  imgPill.image.onload = () => (imgPill.isLoaded = true);
  */

  canvas.width = width * pixelDensity;
  canvas.height = height * pixelDensity;
  canvas.style.width = width + 'px';
  canvas.style.height = height + 'px';
  ctx.scale(pixelDensity, pixelDensity);

  function throttle(callback, delay) {
    let lastTime = performance.now();
    return function (...args) {
      const currentTime = performance.now();
      if (currentTime - lastTime > delay) {
        callback(...args);
        lastTime = currentTime;
      }
    };
  }

  function playSimulation() {
    if (!isSimulating) {
      isSimulating = true;
      update.lastTime = performance.now();
      update();
    }
  }

  function pauseSimulation() {
    isSimulating = false;
    cancelAnimationFrame(simulationId);
    renderSimulation(bodies, deltaTime);
  }

  function restartSimulation() {
    pauseSimulation();
    deltaTime = 0;
    initialize();
  }

  canvas.addEventListener(
    'pointerdown',
    throttle(event => {
      const rectWidth = Math.random() * (maxSize - minSize) + minSize;
      const rectHeight = Math.random() * (maxSize - minSize) + minSize;
      const radius = (Math.random() * (maxSize - minSize) + minSize) * 0.5;
      const pointer = new Vector2(event.offsetX, event.offsetY);
      const option = {
        restitution,
        wireframe,
        velocity: new Vector2().zero().scale(0.5)
      };

      if (isSimulating) {
        const rect = new Rectangle(
          pointer.x,
          pointer.y,
          rectWidth,
          rectHeight,
          option
        );
        bodies.push(rect);
        spatialGrid.addData(rect);
      }
    }, 1000 / 30)
  );

  canvas.addEventListener(
    'pointermove',
    throttle(event => {
      const pillWidth = Math.random() * (maxSize - minSize) + minSize;
      const pillHeight = Math.random() * (maxSize - minSize) + minSize;
      const radius = (Math.random() * (maxSize - minSize) + minSize) * 0.5;
      const pointer = new Vector2(event.offsetX, event.offsetY);
      const option = {
        restitution,
        wireframe,
        velocity: new Vector2().zero().scale(0.5)
      };

      if (isSimulating) {
        if (Math.random() - 0.5 < 0) {
          const pill = new Pill(pointer, maxSize - radius, pillHeight, option);
          bodies.push(pill);
          spatialGrid.addData(pill);
        } else {
          const circle = new Circle(pointer.x, pointer.y, radius, option);
          bodies.push(circle);
          spatialGrid.addData(circle);
        }
      }
    }, 1000 / 30)
  );

  playBtn.addEventListener('click', playSimulation);

  pauseBtn.addEventListener('click', pauseSimulation);

  restartBtn.addEventListener('click', restartSimulation);

  wireframeBtn.addEventListener('click', () => {
    bodies.forEach(body => {
      body.wireframe = !body.wireframe;
    });
    wireframe = !wireframe;
  });

  contactsBtn.addEventListener(
    'click',
    () => (isRenderContactPoints = !isRenderContactPoints)
  );
  
  gridBtn.addEventListener(
    'click',
    () => (isRenderGrid = !isRenderGrid)
  );
  
  aabbBtn.addEventListener(
    'click',
    () => (isRenderAABBs = !isRenderAABBs)
  );

  function initialize() {
    bodies.length = 0;
    spatialGrid.grid.forEach(cell => (cell.length = 0));

    bodies.push(groundRect);
    spatialGrid.addData(groundRect);

    renderSimulation(bodies, deltaTime);
  }

  initialize();

  function renderSimulation(bodies, deltaTime) {
    const fps = Math.round(1000 / deltaTime);
    const fontSize = 12;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.font = 'bold 50px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#686868';

    isSimulating
      ? ctx.fillText(`Playing`, width / 2, height / 4)
      : ctx.fillText(`Paused`, width / 2, height / 4);

    isRenderGrid && spatialGrid.render(ctx);

    ctx.font = `normal ${fontSize}px Arial`;
    ctx.textAlign = 'start';
    ctx.textBaseline = 'top';
    ctx.fillStyle = 'white';

    ctx.fillText(`${fps === Infinity ? 0 : fps} fps`, fontSize, fontSize);
    ctx.fillText(`${bodies.length} bodies`, fontSize, fontSize * 2);
    ctx.fillText(`${subSteps} substeps`, fontSize, fontSize * 3);
    isRenderGrid &&
      ctx.fillText(`${spatialGrid.scale} grid-scale`, fontSize, fontSize * 4);
    if (isRenderGrid) {
      ctx.fillText(
        `${spatialGrid.grid.length} grid-cells`,
        fontSize,
        fontSize * 5
      );
    }

    for (const body of bodies) {
      if (isRenderAABBs) {
        const aabb = body.getAABB();

        ctx.strokeStyle = aabbColor;
        ctx.strokeRect(aabb.min[0], aabb.min[1], aabb.width, aabb.height);
      }
      body.render(ctx);

      /* if (imgBall.isLoaded && body.shape === 'Circle' && !body.isStatic) {
        const radius = body.radius * 2;
        const dir = Vector2.subtract(body.p1, body.position);
        const angle = Math.atan2(dir.y, dir.x);

        ctx.save();
        ctx.translate(body.position.x, body.position.y);
        ctx.rotate(angle);
        ctx.drawImage(
          imgBall.image,
          -radius * 0.5,
          -radius * 0.5,
          radius,
          radius
        );
        ctx.restore();

        continue;
      }

      if (imgBox.isLoaded && body.shape === 'Rectangle' && !body.isStatic) {
        const boxWidth = body.width;
        const boxHeight = body.height;
        const position = body.getCentroid();
        const dir = Vector2.subtract(body.p1, position);
        const angle = Math.atan2(dir.y, dir.x);

        ctx.save();
        ctx.translate(position.x, position.y);
        ctx.rotate(angle);
        ctx.drawImage(
          imgBox.image,
          -boxWidth * 0.5,
          -boxHeight * 0.5,
          boxWidth,
          boxHeight
        );
        ctx.restore();

        continue;
      }

      if (imgPill.isLoaded && body.shape === 'Pill' && !body.isStatic) {
        const pillWidth = body.width;
        const pillHeight = body.height + body.radius * 2;
        const position = body.getCentroid();
        const dir = Vector2.subtract(body.anglePoint, body.getCentroid());
        const angle = Math.atan2(dir.y, dir.x);

        ctx.save();
        ctx.translate(position.x, position.y);
        ctx.rotate(angle);
        ctx.drawImage(
          imgPill.image,
          -pillWidth * 0.5,
          -pillHeight * 0.5,
          pillWidth,
          pillHeight
        );
        ctx.restore();

        continue;
      }
      */
    }
  }

  function update() {
    const currentTime = performance.now();
    deltaTime = currentTime - update.lastTime || 0;
    update.lastTime = currentTime;

    renderSimulation(bodies, deltaTime);

    // Simulate
    for (let s = 1; s <= subSteps; s++) {
      const dt = deltaTime / subSteps;
      for (let i = 0; i < bodies.length; i++) {
        const bodyA = bodies[i];
        const acceleration = Vector2.scale(gravity, bodyA.inverseMass);

        bodyA.velocity.add(acceleration, dt);
        bodyA.move(bodyA.velocity, dt);
        bodyA.rotate(bodyA.angularVelocity * dt);

        if (s === subSteps) spatialGrid.updateData(bodyA);

        const nearby = spatialGrid.queryNearby(bodyA);

        for (let j = 0; j < nearby.length; j++) {
          const bodyB = nearby[j];

          if (bodyA.shape === 'Pill' && bodyB.shape === 'Pill') {
            const { collision, normal, overlapDepth } =
              Collision.detectPillToPill(bodyA, bodyB);
            if (collision) {
              const contactPoints = Collision.supportsPillToPill(
                bodyA,
                bodyB,
                normal
              );
              if (s === subSteps && isRenderContactPoints) {
                for (const point of contactPoints) {
                  ctx.fillStyle = contactPointColor;
                  ctx.fillRect(point.x - 2, point.y - 2, 4, 4);
                }
              }
              Resolver.separatesBodies(bodyA, bodyB, normal, overlapDepth);
              Resolver.resolveCollision(bodyA, bodyB, normal, contactPoints);
            }
          }
          if (bodyA.shape === 'Rectangle' && bodyB.shape === 'Rectangle') {
            const { collision, normal, overlapDepth } =
              Collision.detectRectangleToRectangle(bodyA, bodyB);
            if (collision) {
              const contactPoints = Collision.supportsRectangleToRectangle(
                bodyA,
                bodyB,
                normal
              );
              if (s === subSteps && isRenderContactPoints) {
                for (const point of contactPoints) {
                  ctx.fillStyle = contactPointColor;
                  ctx.fillRect(point.x - 2, point.y - 2, 4, 4);
                }
              }
              Resolver.separatesBodies(bodyA, bodyB, normal, overlapDepth);
              Resolver.resolveCollision(bodyA, bodyB, normal, contactPoints);
            }
          }
          if (bodyA.shape === 'Circle' && bodyB.shape === 'Circle') {
            const { collision, normal, overlapDepth } =
              Collision.detectCircleToCircle(bodyA, bodyB);
            if (collision) {
              const contactPoints = Collision.supportsCircleToCircle(
                bodyA,
                normal
              );
              if (s === subSteps && isRenderContactPoints) {
                for (const point of contactPoints) {
                  ctx.fillStyle = contactPointColor;
                  ctx.fillRect(point.x - 2, point.y - 2, 4, 4);
                }
              }
              Resolver.separatesBodies(bodyA, bodyB, normal, overlapDepth);
              Resolver.resolveCollision(bodyA, bodyB, normal, contactPoints);
            }
          }
          if (bodyA.shape === 'Pill' && bodyB.shape === 'Rectangle') {
            const { collision, normal, overlapDepth } =
              Collision.detectRectangleToPill(bodyB, bodyA);
            if (collision) {
              const contactPoints = Collision.supportsRectangleToPill(
                bodyB,
                bodyA,
                normal
              );
              if (s === subSteps && isRenderContactPoints) {
                for (const point of contactPoints) {
                  ctx.fillStyle = contactPointColor;
                  ctx.fillRect(point.x - 2, point.y - 2, 4, 4);
                }
              }
              Resolver.separatesBodies(bodyB, bodyA, normal, overlapDepth);
              Resolver.resolveCollision(bodyB, bodyA, normal, contactPoints);
            }
          }
          if (bodyA.shape === 'Rectangle' && bodyB.shape === 'Pill') {
            const { collision, normal, overlapDepth } =
              Collision.detectRectangleToPill(bodyA, bodyB);
            if (collision) {
              const contactPoints = Collision.supportsRectangleToPill(
                bodyA,
                bodyB,
                normal
              );
              if (s === subSteps && isRenderContactPoints) {
                for (const point of contactPoints) {
                  ctx.fillStyle = contactPointColor;
                  ctx.fillRect(point.x - 2, point.y - 2, 4, 4);
                }
              }
              Resolver.separatesBodies(bodyA, bodyB, normal, overlapDepth);
              Resolver.resolveCollision(bodyA, bodyB, normal, contactPoints);
            }
          }
          if (bodyA.shape === 'Circle' && bodyB.shape === 'Rectangle') {
            const { collision, normal, overlapDepth } =
              Collision.detectCircleToRectangle(bodyA, bodyB);
            if (collision) {
              const contactPoints = Collision.supportsCircleToRectangle(
                bodyA.position,
                bodyB.vertices,
                normal
              );
              if (s === subSteps && isRenderContactPoints) {
                for (const point of contactPoints) {
                  ctx.fillStyle = contactPointColor;
                  ctx.fillRect(point.x - 2, point.y - 2, 4, 4);
                }
              }
              Resolver.separatesBodies(bodyA, bodyB, normal, overlapDepth);
              Resolver.resolveCollision(bodyA, bodyB, normal, contactPoints);
            }
          }
          if (bodyA.shape === 'Rectangle' && bodyB.shape === 'Circle') {
            const { collision, normal, overlapDepth } =
              Collision.detectCircleToRectangle(bodyB, bodyA);
            if (collision) {
              const contactPoints = Collision.supportsCircleToRectangle(
                bodyB.position,
                bodyA.vertices,
                normal
              );
              if (s === subSteps && isRenderContactPoints) {
                for (const point of contactPoints) {
                  ctx.fillStyle = contactPointColor;
                  ctx.fillRect(point.x - 2, point.y - 2, 4, 4);
                }
              }
              Resolver.separatesBodies(bodyB, bodyA, normal, overlapDepth);
              Resolver.resolveCollision(bodyB, bodyA, normal, contactPoints);
            }
          }
          if (bodyA.shape === 'Circle' && bodyB.shape === 'Pill') {
            const { collision, normal, overlapDepth } =
              Collision.detectCircleToPill(bodyA, bodyB);
            if (collision) {
              const contactPoints = Collision.supportsCircleToPill(
                bodyA,
                normal
              );
              if (s === subSteps && isRenderContactPoints) {
                for (const point of contactPoints) {
                  ctx.fillStyle = contactPointColor;
                  ctx.fillRect(point.x - 2, point.y - 2, 4, 4);
                }
              }
              Resolver.separatesBodies(bodyA, bodyB, normal, overlapDepth);
              Resolver.resolveCollision(bodyA, bodyB, normal, contactPoints);
            }
          }
          if (bodyA.shape === 'Pill' && bodyB.shape === 'Circle') {
            const { collision, normal, overlapDepth } =
              Collision.detectCircleToPill(bodyB, bodyA);
            if (collision) {
              const contactPoints = Collision.supportsCircleToPill(
                bodyB,
                normal
              );
              if (s === subSteps && isRenderContactPoints) {
                for (const point of contactPoints) {
                  ctx.fillStyle = contactPointColor;
                  ctx.fillRect(point.x - 2, point.y - 2, 4, 4);
                }
              }
              Resolver.separatesBodies(bodyB, bodyA, normal, overlapDepth);
              Resolver.resolveCollision(bodyB, bodyA, normal, contactPoints);
            }
          }
        }
      }
    }

    // Remove Offscreen Bodies
    for (let i = 0; i < bodies.length; i++) {
      const body = bodies[i];
      const aabb = body.getAABB();
      if (
        aabb.min[0] < -aabb.width ||
        aabb.max[0] > width + aabb.width ||
        aabb.min[1] < -aabb.height ||
        aabb.max[1] > height + aabb.height
      ) {
        const temp = body;
        const endIndex = bodies.length - 1;

        bodies[i] = bodies[endIndex];
        bodies[endIndex] = temp;
        bodies.pop();
        spatialGrid.removeData(body);
      }
    }

    if (isSimulating) simulationId = requestAnimationFrame(update);
  }

  update();
}

window.onload = main;
