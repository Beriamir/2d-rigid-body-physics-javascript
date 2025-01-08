import { Vector2 } from './Vector2.js';

export class Circle {
  constructor(x, y, radius, option = {}) {
    this.shape = 'Circle';
    this.isStatic = option.isStatic || false;

    this.position = new Vector2(x, y);
    this.p1 = new Vector2(x - radius, y);
    this.radius = radius;

    this.colors = ['#f5691c', '#1c64f5', '#f51c38', '#f5c01c', '#1cf56c'];
    this.color =
      option.color ||
      this.colors[Math.floor(Math.random() * this.colors.length)];

    this.velocity = option.velocity || new Vector2();
    this.angularVelocity = 0;
    this.density = 2700;
    this.thickness = 0.01;
    this.area = this.radius * this.radius * Math.PI;
    this.mass = this.density * this.area * this.thickness;
    this.inverseMass = 1 / this.mass;
    this.inertia = (1 / 2) * this.mass * this.radius * this.radius;
    this.inverseInertia = 1 / this.inertia;
    this.restitution = option.restitution || 0.9;
    this.friction = {
      static: 0.61,
      dynamic: 0.47
    };

    this.wireframe =
      option.wireframe === undefined
        ? true
        : typeof option.wireframe !== 'boolean'
        ? true
        : option.wireframe;

    if (this.isStatic) {
      this.inverseMass = 0;
      this.inverseInertia = 0;
      this.velocity.zero();
      this.angularVelocity = 0;
      this.restitution = 1;
    }

    this.aabb = null;
  }

  getAABB() {
    const min = [this.position.x - this.radius, this.position.y - this.radius];
    const max = [this.position.x + this.radius, this.position.y + this.radius];
    
    return {
      min,
      max,
      width: max[0] - min[0],
      height: max[1] - min[1]
    };
  }

  render(ctx) {
    ctx.beginPath();
    ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
    ctx.closePath();

    ctx.moveTo(this.position.x, this.position.y);
    ctx.lineTo(this.p1.x, this.p1.y);

    if (!this.wireframe) {
      ctx.fillStyle = this.color;
      ctx.fill();
    } else {
      ctx.strokeStyle = '#ffffffa5';
      ctx.stroke();
    }
  }

  move(vector, scalar = 1) {
    for (const point of [this.position, this.p1]) {
      point.add(vector, scalar);
    }
  }

  rotate(angle) {
    const translated = Vector2.subtract(this.p1, this.position);
    const rotated = translated.rotate(angle);

    this.p1.copy(rotated.add(this.position));
  }
}
