import { Vector2 } from './Vector2.js';

export class Rectangle {
  constructor(x, y, width, height, option = {}) {
    this.shape = 'Rectangle';
    this.isStatic = option.isStatic || false;

    this.width = width;
    this.height = height;

    this.vertices = [
      new Vector2(x - this.width / 2, y - this.height / 2),
      new Vector2(x + this.width / 2, y - this.height / 2),
      new Vector2(x + this.width / 2, y + this.height / 2),
      new Vector2(x - this.width / 2, y + this.height / 2)
    ];

    this.colors = ['#f5691c', '#1c64f5', '#f51c38', '#f5c01c', '#1cf56c'];
    this.color =
      option.color ||
      this.colors[Math.floor(Math.random() * this.colors.length)];

    this.velocity = option.velocity || new Vector2();
    this.angularVelocity = 0;
    this.density = 1800; // Brick, common (1800, 0.3, [0.8, 0.6])
    this.thickness = 0.02;
    this.area = this.width * this.height;
    this.mass = this.density * this.area * this.thickness;
    this.inverseMass = 1 / this.mass;
    this.inertia = (1 / 12) * this.mass * (this.height ** 2 + this.width ** 2);
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
    const center = this.getCentroid();
    
    ctx.beginPath();
    ctx.moveTo(this.vertices[0].x, this.vertices[0].y);
    for (let i = 0; i < this.vertices.length; i++) {
      ctx.lineTo(this.vertices[i].x, this.vertices[i].y);
    }
    ctx.closePath();

    if (this.wireframe === 'false') {
      ctx.fillStyle = this.color;
      ctx.fill();
    }
    ctx.strokeStyle = 'white';
    ctx.stroke();
  }

  move(vector, scalar = 1) {
    for (const point of this.vertices) {
      point.add(vector, scalar);
    }
  }

  rotate(angle) {
    const center = this.getCentroid();

    for (const point of this.vertices) {
      const translated = Vector2.subtract(center, point);
      const rotated = translated.rotate(angle);

      point.copy(rotated.add(center));
    }
  }

  getCentroid() {
    const sumX = this.vertices.reduce((sum, v) => sum + v.x, 0);
    const sumY = this.vertices.reduce((sum, v) => sum + v.y, 0);
    const count = this.vertices.length;

    return new Vector2(sumX / count, sumY / count);
  }
}
