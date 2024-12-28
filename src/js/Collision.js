import { Vector2 } from './Vector2.js';

function _getAxes(vertices) {
  const axes = [];
  for (let i = 0; i < vertices.length; i++) {
    const p1 = vertices[i];
    const p2 = vertices[(i + 1) % vertices.length];
    const edge = Vector2.subtract(p2, p1);
    const axis = edge.perp().normalize();
    axes.push(axis);
  }
  return axes;
}

function _projectCircle(body, axis) {
  return {
    min: body.position.dot(axis) - body.radius,
    max: body.position.dot(axis) + body.radius
  };
}

function _projectPoint(point, radius, axis) {
  return {
    min: point.dot(axis) - radius,
    max: point.dot(axis) + radius
  };
}

function _projectPillPoints(p1, p2, radius, axis) {
  const projection1 = p1.dot(axis);
  const projection2 = p2.dot(axis);

  return {
    min: Math.min(projection1, projection2) - radius,
    max: Math.max(projection1, projection2) + radius
  };
}

function _projectPolygon(vertices, axis) {
  let min = Infinity;
  let max = -min;

  for (const point of vertices) {
    const projection = point.dot(axis);

    if (projection < min) min = projection;
    if (projection > max) max = projection;
  }

  return { min, max };
}

function _getClosestPointIndex(position, vertices) {
  let index = -1;
  let minDistanceSq = Infinity;

  for (let i = 0; i < vertices.length; i++) {
    const distanceSq = Vector2.distance(vertices[i], position);

    if (distanceSq < minDistanceSq) {
      minDistanceSq = distanceSq;
      index = i;
    }
  }

  return index;
}

function _pointInLineSegment(p1, p2, position) {
  const ab = Vector2.subtract(p2, p1);
  const ap = Vector2.subtract(position, p1);
  const abLengthSq = ab.magnitudeSq();
  const projection = ap.dot(ab) / abLengthSq;
  const contactPoint = Vector2.add(p1, ab.scale(projection));

  if (projection < 0) {
    contactPoint.copy(p1);
  } else if (projection > 1) {
    contactPoint.copy(p2);
  }

  const distanceSq = Vector2.distanceSq(position, contactPoint);

  return { contactPoint, distanceSq };
}

// Circle To Circle
export function detectCircleToCircle(bodyA, bodyB) {
  const direction = Vector2.subtract(bodyB.position, bodyA.position);
  const distanceSq = direction.magnitudeSq();
  const radii = bodyA.radius + bodyB.radius;

  if (distanceSq === 0 || distanceSq >= radii * radii) {
    return {
      collision: false,
      normal: null,
      overlapDepth: 0
    };
  }

  const distance = Math.sqrt(distanceSq);
  const normal = direction.scale(1 / distance);
  const overlapDepth = (radii - distance) * 0.5;

  return {
    collision: true,
    normal,
    overlapDepth
  };
}

export function supportsCircleToCircle(bodyA, normal) {
  const contactPoint = Vector2.add(
    bodyA.position,
    Vector2.scale(normal, bodyA.radius)
  );

  return [contactPoint];
}

// Circle To Rectangle
export function detectCircleToRectangle(bodyA, bodyB) {
  let normal = new Vector2();
  let minOverlapDepth = Infinity;

  const axes = _getAxes(bodyB.vertices);
  const closestPointIndex = _getClosestPointIndex(
    bodyA.position,
    bodyB.vertices
  );
  const circleToClosestPointAxis = Vector2.subtract(
    bodyB.vertices[closestPointIndex],
    bodyA.position
  ).normalize();

  for (const axis of [circleToClosestPointAxis, ...axes]) {
    const projA = _projectCircle(bodyA, axis);
    const projB = _projectPolygon(bodyB.vertices, axis);

    if (projA.min > projB.max || projB.min > projA.max) {
      return {
        collision: false,
        normal: null,
        overlapDepth: 0
      };
    }

    const axisOverlapDepth = Math.min(
      projA.max - projB.min,
      projB.max - projA.min
    );

    if (axisOverlapDepth < minOverlapDepth) {
      minOverlapDepth = axisOverlapDepth;
      normal.copy(axis);
    }

    const direction = Vector2.subtract(bodyB.getCentroid(), bodyA.position);

    if (direction.dot(normal) < 0) normal.negate();
  }

  return {
    collision: true,
    normal,
    overlapDepth: minOverlapDepth * 0.5
  };
}

export function supportsCircleToRectangle(position, vertices) {
  let minDistanceSq = Infinity;
  let closestContactPoint = null;

  for (let i = 0; i < vertices.length; i++) {
    const p1 = vertices[i];
    const p2 = vertices[(i + 1) % vertices.length];

    const { contactPoint, distanceSq } = _pointInLineSegment(p1, p2, position);

    if (distanceSq < minDistanceSq) {
      minDistanceSq = distanceSq;
      closestContactPoint = contactPoint;
    }
  }

  return [closestContactPoint];
}

// Polygon To Polygon
export function detectRectangleToRectangle(bodyA, bodyB) {
  let normal = new Vector2();
  let minOverlapDepth = Infinity;

  const axesA = _getAxes(bodyA.vertices);
  const axesB = _getAxes(bodyB.vertices);

  for (const axis of [...axesA, ...axesB]) {
    const projA = _projectPolygon(bodyA.vertices, axis);
    const projB = _projectPolygon(bodyB.vertices, axis);

    if (projA.min > projB.max || projB.min > projA.max) {
      return {
        collision: false,
        normal: null,
        overlapDepth: 0
      };
    }

    const axisOverlapDepth = Math.min(
      projA.max - projB.min,
      projB.max - projA.min
    );

    if (axisOverlapDepth < minOverlapDepth) {
      minOverlapDepth = axisOverlapDepth;
      normal.copy(axis);
    }

    const direction = Vector2.subtract(
      bodyB.getCentroid(),
      bodyA.getCentroid()
    );

    if (direction.dot(normal) < 0) normal.negate();
  }

  return {
    collision: true,
    normal,
    overlapDepth: minOverlapDepth * 0.5
  };
}

export function supportsRectangleToRectangle(bodyA, bodyB) {
  const contactPoint1 = new Vector2(Infinity, Infinity);
  const contactPoint2 = new Vector2(Infinity, Infinity);
  let contactCounts = 0;
  let minDistanceSq = Infinity;

  const getContactPoint = (points, vertices) => {
    for (let i = 0; i < points.length; i++) {
      const point = points[i];

      for (let j = 0; j < vertices.length; j++) {
        const p1 = vertices[j];
        const p2 = vertices[(j + 1) % vertices.length];

        const { contactPoint, distanceSq } = _pointInLineSegment(p1, p2, point);

        if (Math.abs(distanceSq - minDistanceSq) <= 5e-4) {
          if (
            !contactPoint.equal(contactPoint1) &&
            !contactPoint.equal(contactPoint2)
          ) {
            minDistanceSq = distanceSq;
            contactPoint2.copy(contactPoint);
            contactCounts = 2;
          }
        } else if (distanceSq < minDistanceSq) {
          minDistanceSq = distanceSq;
          contactPoint1.copy(contactPoint);
          contactCounts = 1;
        }
      }
    }
  };

  getContactPoint(bodyA.vertices, bodyB.vertices);
  getContactPoint(bodyB.vertices, bodyA.vertices);

  const contactPoints = [];

  if (contactCounts === 1) {
    contactPoints.push(contactPoint1);
  } else if (contactCounts === 2) {
    contactPoints.push(contactPoint1, contactPoint2);
  }

  return contactPoints;
}

// Polygon To Pill
export function detectRectangleToPill(bodyA, bodyB) {
  const normal = new Vector2();
  let minOverlapDepth = Infinity;

  const axesA = _getAxes(bodyA.vertices);
  const axisB = Vector2.subtract(bodyB.p1, bodyB.p2).normalize();
  const axisBPerp = Vector2.subtract(bodyB.p1, bodyB.p2).perp().normalize();

  for (const axis of [...axesA, axisB, axisBPerp]) {
    const projA = _projectPolygon(bodyA.vertices, axis);
    const projB = _projectPillPoints(bodyB.p1, bodyB.p2, bodyB.radius, axis);

    if (projA.min > projB.max || projB.min > projA.max) {
      return {
        collision: false,
        normal: null,
        overlapDepth: 0
      };
    }

    const axisOverlapDepth = Math.min(
      projA.max - projB.min,
      projB.max - projA.min
    );

    if (axisOverlapDepth < minOverlapDepth) {
      minOverlapDepth = axisOverlapDepth;
      normal.copy(axis);
    }

    const direction = Vector2.subtract(
      bodyB.getCentroid(),
      bodyA.getCentroid()
    );

    if (direction.dot(normal) < 0) normal.negate();
  }

  return {
    collision: true,
    normal,
    overlapDepth: minOverlapDepth * 0.5
  };
}

export function supportsRectangleToPill(bodyA, bodyB, normal) {
  const contactPoint1 = new Vector2(Infinity, Infinity);
  const contactPoint2 = new Vector2(Infinity, Infinity);
  let contactCounts = 0;
  let minDistanceSq = Infinity;

  const getContactPoint = (points, vertices) => {
    for (let i = 0; i < points.length; i++) {
      const point = points[i];

      for (let j = 0; j < vertices.length; j++) {
        const p1 = vertices[j];
        const p2 = vertices[(j + 1) % vertices.length];

        const { contactPoint, distanceSq } = _pointInLineSegment(p1, p2, point);

        if (Math.abs(distanceSq - minDistanceSq) <= 5e-4) {
          if (
            !contactPoint.equal(contactPoint1) &&
            !contactPoint.equal(contactPoint2)
          ) {
            minDistanceSq = distanceSq;
            contactPoint2.copy(contactPoint);
            contactCounts = 2;
          }
        } else if (distanceSq < minDistanceSq) {
          minDistanceSq = distanceSq;
          contactPoint1.copy(contactPoint);
          contactCounts = 1;
        }
      }
    }
  };

  getContactPoint(bodyA.vertices, [bodyB.p1, bodyB.p2]);

  const direction1 = Vector2.subtract(bodyA.getCentroid(), contactPoint1);
  const direction2 = Vector2.subtract(bodyA.getCentroid(), contactPoint2);

  if (direction1.dot(normal) < 0) {
    contactPoint1.add(Vector2.scale(normal, -bodyB.radius));
  } else {
    contactPoint1.add(Vector2.scale(normal, bodyB.radius));
  }

  if (direction2.dot(normal) < 0) {
    contactPoint2.add(Vector2.scale(normal, -bodyB.radius));
  } else {
    contactPoint2.add(Vector2.scale(normal, bodyB.radius));
  }

  getContactPoint([bodyB.p1, bodyB.p2], bodyA.vertices);

  const contactPoints = [];

  if (contactCounts === 1) {
    contactPoints.push(contactPoint1);
  } else if (contactCounts === 2) {
    contactPoints.push(contactPoint1, contactPoint2);
  }

  return contactPoints;
}

// Pill To Pill
export function detectPillToPill(bodyA, bodyB) {
  let normal = new Vector2();
  let minOverlapDepth = Infinity;

  const { contactPoint: pointA } = _pointInLineSegment(
    bodyA.p1,
    bodyA.p2,
    bodyB.getCentroid()
  );
  const { contactPoint: pointB } = _pointInLineSegment(
    bodyB.p1,
    bodyB.p2,
    bodyA.getCentroid()
  );

  const axis0 = Vector2.subtract(pointB, pointA).normalize();
  const axis1 = Vector2.subtract(bodyA.p1, bodyA.p2).perp().normalize();
  const axis2 = Vector2.subtract(bodyB.p1, bodyB.p2).perp().normalize();

  for (const axis of [axis0, axis1, axis2]) {
    const projA = _projectPillPoints(bodyA.p1, bodyA.p2, bodyA.radius, axis);
    const projB = _projectPillPoints(bodyB.p1, bodyB.p2, bodyB.radius, axis);

    if (projA.min > projB.max || projB.min > projA.max) {
      return {
        collision: false,
        normal: null,
        overlapDepth: 0
      };
    }

    const axisOverlapDepth = Math.min(
      projA.max - projB.min,
      projB.max - projA.min
    );

    if (axisOverlapDepth < minOverlapDepth) {
      minOverlapDepth = axisOverlapDepth;
      normal.copy(axis);
    }

    const direction = Vector2.subtract(
      bodyB.getCentroid(),
      bodyA.getCentroid()
    );

    if (direction.dot(normal) < 0) normal.negate();
  }

  return {
    collision: true,
    normal,
    overlapDepth: minOverlapDepth * 0.5
  };
}

export function supportsPillToPill(bodyA, bodyB, normal) {
  const contactPoint1 = new Vector2(Infinity, Infinity);
  const contactPoint2 = new Vector2(Infinity, Infinity);
  let contactCounts = 0;
  let minDistanceSq = Infinity;

  const getContactPoint = (points, vertices) => {
    for (let i = 0; i < points.length; i++) {
      const point = points[i];

      for (let j = 0; j < vertices.length; j++) {
        const p1 = vertices[j];
        const p2 = vertices[(j + 1) % vertices.length];

        const { contactPoint, distanceSq } = _pointInLineSegment(p1, p2, point);

        if (Math.abs(distanceSq - minDistanceSq) <= 5e-4) {
          if (
            !contactPoint.equal(contactPoint1) &&
            !contactPoint.equal(contactPoint2)
          ) {
            minDistanceSq = distanceSq;
            contactPoint2.copy(contactPoint);
            contactCounts = 2;
          }
        } else if (distanceSq < minDistanceSq) {
          minDistanceSq = distanceSq;
          contactPoint1.copy(contactPoint);
          contactCounts = 1;
        }
      }
    }
  };

  getContactPoint([bodyA.p1, bodyA.p2], [bodyB.p1, bodyB.p2]);
  getContactPoint([bodyB.p1, bodyB.p2], [bodyA.p1, bodyA.p2]);

  const contactPoints = [];

  if (contactCounts === 1) {
    contactPoints.push(contactPoint1);
  } else if (contactCounts === 2) {
    contactPoints.push(contactPoint1, contactPoint2);
  }

  const { contactPoint: pointB } = _pointInLineSegment(
    bodyB.p1,
    bodyB.p2,
    bodyA.getCentroid()
  );
  const { contactPoint: pointA } = _pointInLineSegment(
    bodyA.p1,
    bodyA.p2,
    pointB
  );

  const directionAB = Vector2.subtract(pointB, pointA);
  const distanceSq = directionAB.magnitudeSq();
  const radii = bodyA.radius + bodyB.radius;

  if (distanceSq <= radii * radii) {
    if (directionAB.dot(normal) < 0) {
      pointA.add(Vector2.scale(normal, -bodyA.radius));
    } else {
      pointA.add(Vector2.scale(normal, bodyA.radius));
    }
  }

  contactPoints.push(pointA);

  return contactPoints;
}

// Circle To Pill
export function detectCircleToPill(bodyA, bodyB) {
  const { contactPoint: pointB } = _pointInLineSegment(
    bodyB.p1,
    bodyB.p2,
    bodyA.position
  );

  const direction = Vector2.subtract(pointB, bodyA.position);
  const distanceSq = direction.magnitudeSq();
  const radii = bodyA.radius + bodyB.radius;

  if (distanceSq === 0 || distanceSq >= radii * radii) {
    return {
      collision: false,
      normal: null,
      overlapDepth: 0
    };
  }

  const distance = Math.sqrt(distanceSq);
  const normal = direction.scale(1 / distance);
  const overlapDepth = (radii - distance) * 0.5;

  return {
    collision: true,
    normal,
    overlapDepth
  };
}

export function supportsCircleToPill(bodyA, normal) {
  const contactPoint = Vector2.add(
    bodyA.position,
    Vector2.scale(normal, bodyA.radius)
  );

  return [contactPoint];
}
