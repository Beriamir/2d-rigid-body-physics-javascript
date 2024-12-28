import { Vector2 } from './Vector2.js';

export class Pill {
  constructor(position, width, height, option = {}) {
    this.shape = 'Pill';
    this.isStatic = option.isStatic || false;
  
    this.width = width;
    this.height = height;
    this.radius = width / 2;

    this.anglePoint = new Vector2(position.x + this.radius, position.y);
    this.p1 = new Vector2(position.x, position.y - this.height / 2);
    this.p2 = new Vector2(position.x, position.y + this.height / 2);
    this.vertices = [
      new Vector2(this.p1.x - this.radius, this.p1.y),
      new Vector2(this.p1.x + this.radius, this.p1.y),
      new Vector2(this.p2.x + this.radius, this.p2.y),
      new Vector2(this.p2.x - this.radius, this.p2.y)
    ];

    this.colors = ['#f5691c', '#1c64f5', '#f51c38', '#f5c01c', '#1cf56c'];
    this.color =
      option.color ||
      this.colors[Math.floor(Math.random() * this.colors.length)];

    this.velocity = option.velocity || new Vector2();
    this.angularVelocity = 0;
    this.density = 1800; // Brick, common (1800, 0.3, [0.8, 0.6])
    this.thickness = 0.02;
    this.area = this.radius * this.radius * Math.PI + this.width * this.height;
    this.mass = this.density * this.area * this.thickness;
    this.inverseMass = 1 / this.mass;
    this.inertia = (1 / 12) * this.mass * (this.width ** 2 + this.height ** 2);
    this.inverseInertia = 1 / this.inertia;
    this.restitution = option.restitution || 0.3;
    this.friction = {
      static: 0.8,
      dynamic: 0.6
    };
    this.wireframe = option.wireframe || 'true';
    
    if (this.isStatic) {
      this.inverseMass = 0;
      this.inverseInertia = 0;
      this.velocity.zero();
      this.angularVelocity = 0;
      this.restitution = 1;
      this.color = 'gray';
    }
    
    this.aabb = null;
  }

  render(ctx) {
    const startDirP1 = Vector2.subtract(this.vertices[0], this.p1);
    const startDirP2 = Vector2.subtract(this.vertices[2], this.p2);
    const endDirP1 = Vector2.subtract(this.vertices[1], this.p1);
    const endDirP2 = Vector2.subtract(this.vertices[3], this.p2);

    const startAngleP1 = Math.atan2(startDirP1.y, startDirP1.x);
    const startAngleP2 = Math.atan2(startDirP2.y, startDirP2.x);
    const endAngleP1 = Math.atan2(endDirP1.y, endDirP1.x);
    const endAngleP2 = Math.atan2(endDirP2.y, endDirP2.x);

    ctx.beginPath();
    ctx.arc(this.p1.x, this.p1.y, this.radius, startAngleP1, endAngleP1);
    ctx.arc(this.p2.x, this.p2.y, this.radius, startAngleP2, endAngleP2);
    ctx.closePath();

    // Middle Line
    // ctx.moveTo(this.p1.x, this.p1.y);
    // ctx.lineTo(this.p2.x, this.p2.y);

    if (this.wireframe === 'false') {
      ctx.fillStyle = this.color;
      ctx.fill();
    } else {
      
    
    ctx.strokeStyle = 'white';
    ctx.stroke();
    }
  }

  move(vector, scalar = 1) {
    for (const point of [this.anglePoint, this.p1, this.p2, ...this.vertices]) {
      point.add(vector, scalar);
    }
  }

  rotate(angle) {
    const center = this.getCentroid();

    for (const point of [this.anglePoint, this.p1, this.p2, ...this.vertices]) {
      const translated = Vector2.subtract(center, point);
      const rotated = translated.rotate(angle);

      point.copy(rotated.add(center));
    }
  }

  getCentroid() {
    const sumX = this.p1.x + this.p2.x;
    const sumY = this.p1.y + this.p2.y;
    const count = 2;

    return new Vector2(sumX / count, sumY / count);
  }
}
