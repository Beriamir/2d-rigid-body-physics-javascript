export class SpatialGrid {
  constructor(bounds, dimentions) {
    this.bounds = bounds;
    this.dimentions = dimentions;
    this.cells = new Map();

    for (let x = 0; x < this.dimentions.x; x++) {
      for (let y = 0; y < this.dimentions.y; y++) {
        const key = this._key(x, y);

        this.cells.set(key, new Set());
      }
    }
  }

  _key(x, y) {
    return x * this.dimentions.y + y;
  }

  _clamp(value, min, max) {
    return value < min ? min : value > max ? max : value;
  }

  _getIndices(position) {
    const x = Math.floor(
      ((position.x - this.bounds.min.x) /
        (this.bounds.max.x - this.bounds.min.x)) *
        this.dimentions.x
    );
    const y = Math.floor(
      ((position.y - this.bounds.min.y) /
        (this.bounds.max.y - this.bounds.min.y)) *
        this.dimentions.y
    );

    return {
      x: this._clamp(x, 0, this.dimentions.x - 1),
      y: this._clamp(y, 0, this.dimentions.y - 1)
    };
  }

  add(client) {
    const { x, y } = this._getIndices(client.position || client.getCentroid());
    const key = this._key(x, y);

    this.cells.get(key).add(client);
    client.cellKey = key;
  }

  update(client) {
    const { x, y } = this._getIndices(client.position || client.getCentroid());
    const newKey = this._key(x, y);

    if (client.cellKey !== newKey) {
      this.cells.get(client.cellKey)?.delete(client);

      this.cells.get(newKey).add(client);
      client.cellKey = newKey;
    }
  }

  getNearby(position) {
    const { x, y } = this._getIndices(position);
    const results = [];

    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        const key = this._key(x + i, y + j);

        if (this.cells.has(key)) {
          for (let client of this.cells.get(key)) {
            results.push(client);
          }
        }
      }
    }

    return results;
  }
}
