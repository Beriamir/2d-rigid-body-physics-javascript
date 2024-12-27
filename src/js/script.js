import { Vector2 } from './Vector2.js';
import { Pill } from './Pill.js';
import { Circle } from './Circle.js';
import { Rectangle } from './Rectangle.js';
import * as Collision from './Collision.js';
import * as Resolver from './Resolver.js';

function main() {
  const canvas = document.getElementById('canvas');
  const playBtn = document.getElementById('play-btn');
  const pauseBtn = document.getElementById('pause-btn');
  const restartBtn = document.getElementById('restart-btn');

  const ctx = canvas.getContext('2d');
  const width = innerWidth;
  const height = innerHeight;
  const pixelDensity = 2;

  const subSteps = 3;
  const gravity = new Vector2(0, 9.81);
  let isSimulating = false;
  let simulationId = null;
  let deltaTime = 0;

  const bodies = [];
  const restitution = 0.8;
  const minSize = 40;
  const maxSize = 50;
  const wireframe = 'false';
  const renderContactPoints = false;
  const groundRect = new Rectangle(width / 2, height * 0.9, 300, 200, {
    isStatic: true,
    wireframe
  });

  const imgBall2 = {
    image: new Image(),
    isLoaded: false
  };
  imgBall2.image.src = '../../assets/ball2.png';
  imgBall2.image.onload = () => (imgBall2.isLoaded = true);

  const imgBall4 = {
    image: new Image(),
    isLoaded: false
  };
  imgBall4.image.src = '../../assets/box4.jpg';
  imgBall4.image.onload = () => (imgBall4.isLoaded = true);

  canvas.width = width * pixelDensity;
  canvas.height = height * pixelDensity;
  canvas.style.width = width + 'pixelDensity';
  canvas.style.height = height + 'pixelDensity';
  ctx.scale(pixelDensity, pixelDensity);
  ctx.font = '12px Arial';
  ctx.textAlign = 'start';
  ctx.textBaseline = 'top';

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

  function generatePills(amount) {
    for (let i = 0; i < amount; i++) {
      const pillWidth = Math.random() * (maxSize - minSize) + minSize;
      let pillHeight = Math.random() * (maxSize - minSize) + minSize;
      const position = new Vector2(
        Math.random() * (width - pillWidth * 2) + pillWidth,
        Math.random() * (height - pillHeight * 2) + pillHeight
      );
      const option = {
        restitution,
        wireframe
      };

      bodies.push(new Pill(position, pillWidth, pillHeight, option));
    }
  }

  function generateRectangles(amount) {
    for (let i = 0; i < amount; i++) {
      const rectWidth = Math.random() * (maxSize - minSize) + minSize;
      const rectHeight = Math.random() * (maxSize - minSize) + minSize;
      const position = new Vector2(
        Math.random() * (width - rectWidth * 2) + rectWidth,
        Math.random() * (height - rectHeight * 2) + rectHeight
      );
      const option = {
        restitution,
        wireframe
      };

      bodies.push(
        new Rectangle(position.x, position.y, rectWidth, rectHeight, option)
      );
    }
  }

  function generateCircles(amount) {
    for (let i = 0; i < amount; i++) {
      const radius = (Math.random() * (maxSize - minSize) + minSize) * 0.5;
      const position = new Vector2(
        Math.random() * (width - radius * 2) + radius,
        Math.random() * (height - radius * 2) + radius
      );
      const option = {
        restitution,
        wireframe
      };

      bodies.push(new Circle(position.x, position.y, radius, option));
    }
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
        } else {
          const circle = new Circle(pointer.x, pointer.y, radius, option);
          bodies.push(circle);
        }
      }
    }, 1000 / 30)
  );

  playBtn.addEventListener('click', playSimulation);
  pauseBtn.addEventListener('click', pauseSimulation);
  restartBtn.addEventListener('click', restartSimulation);

  function initialize() {
    bodies.length = 0;
    bodies.push(groundRect);

    generatePills(0);
    generateRectangles(0);
    generateCircles(0);
    renderSimulation(bodies, deltaTime);
  }

  initialize();

  function renderSimulation(bodies, deltaTime) {
    const fps = Math.round(1000 / deltaTime);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = 'bold 50px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#686868';

    isSimulating
      ? ctx.fillText(`Playing`, width / 2, height / 2)
      : ctx.fillText(`Paused`, width / 2, height / 2);

    ctx.font = 'normal 12px Arial';
    ctx.textAlign = 'start';
    ctx.textBaseline = 'top';
    ctx.fillStyle = 'white';

    ctx.fillText(`${fps === Infinity ? 0 : fps} fps`, 12, 12);
    ctx.fillText(`${bodies.length} bodies`, 12, 12 * 2);
    ctx.fillText(`${subSteps} substeps`, 12, 12 * 3);
    ctx.fillText('naive version (slow)', 12, 12 * 4);
    ctx.fillText('spatial grid coming soon...', 12, 12 * 5);

    for (const body of bodies) {
      if (imgBall2.isLoaded && body.shape === 'Circle') {
        const radius = body.radius * 2;
        const dir = Vector2.subtract(body.p1, body.position);
        const angle = Math.atan2(dir.y, dir.x);

        ctx.save();
        ctx.translate(body.position.x, body.position.y);
        ctx.rotate(angle);
        ctx.drawImage(
          imgBall2.image,
          -radius * 0.5,
          -radius * 0.5,
          radius,
          radius
        );
        ctx.restore();

        continue;
      }

      if (imgBall4.isLoaded && body.shape === 'Rectangle') {
        const boxWidth = body.width;
        const boxHeight = body.height;
        const position = body.getCentroid();
        const dir = Vector2.subtract(body.p1, position);
        const angle = Math.atan2(dir.y, dir.x);

        ctx.save();
        ctx.translate(position.x, position.y);
        ctx.rotate(angle);
        ctx.drawImage(
          imgBall4.image,
          -boxWidth * 0.5,
          -boxHeight * 0.5,
          boxWidth,
          boxHeight
        );
        ctx.restore();

        continue;
      }

      body.render(ctx);
    }
  }

  function update() {
    const currentTime = performance.now();
    deltaTime = currentTime - update.lastTime || 0;
    update.lastTime = currentTime;

    renderSimulation(bodies, deltaTime);

    // Simulate
    for (let s = 0; s <= subSteps; s++) {
      for (let i = 0; i < bodies.length; i++) {
        const bodyA = bodies[i];
        const dt = deltaTime / subSteps;
        const acceleration = Vector2.scale(gravity, bodyA.inverseMass);

        bodyA.velocity.add(acceleration, dt);

        bodyA.move(bodyA.velocity, dt);
        bodyA.rotate(bodyA.angularVelocity * dt);

        // Perform Collision (Naive Version)
        for (let j = 1; j < bodies.length; j++) {
          const bodyB = bodies[j];

          if (bodyA === bodyB) continue;

          if (bodyA.shape === 'Pill' && bodyB.shape === 'Pill') {
            const { collision, normal, overlapDepth } =
              Collision.detectPillToPill(bodyA, bodyB);
            if (collision) {
              const contactPoints = Collision.supportsPillToPill(
                bodyA,
                bodyB,
                normal
              );
              if (s === subSteps && renderContactPoints) {
                for (const point of contactPoints) {
                  ctx.fillStyle = 'red';
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
              if (s === subSteps && renderContactPoints) {
                for (const point of contactPoints) {
                  ctx.fillStyle = 'red';
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
              if (s === subSteps && renderContactPoints) {
                for (const point of contactPoints) {
                  ctx.fillStyle = 'red';
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
              if (s === subSteps && renderContactPoints) {
                for (const point of contactPoints) {
                  ctx.fillStyle = 'red';
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
              if (s === subSteps && renderContactPoints) {
                for (const point of contactPoints) {
                  ctx.fillStyle = 'red';
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
              if (s === subSteps && renderContactPoints) {
                for (const point of contactPoints) {
                  ctx.fillStyle = 'red';
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
              if (s === subSteps && renderContactPoints) {
                for (const point of contactPoints) {
                  ctx.fillStyle = 'red';
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
              if (s === subSteps && renderContactPoints) {
                for (const point of contactPoints) {
                  ctx.fillStyle = 'red';
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
              if (s === subSteps && renderContactPoints) {
                for (const point of contactPoints) {
                  ctx.fillStyle = 'red';
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
      const position = body.position || body.getCentroid();
      if (
        position.x < -maxSize ||
        position.x > width + maxSize ||
        position.y < -maxSize ||
        position.y > height + maxSize
      ) {
        bodies.splice(i, 1);
      }
    }

    if (isSimulating) simulationId = requestAnimationFrame(update);
  }

  update();
}

window.onload = main;
