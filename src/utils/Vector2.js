// Vector2 - 2D vector math utilities
export class Vector2 {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  static fromAngle(angle) {
    return new Vector2(Math.cos(angle), Math.sin(angle));
  }

  static distance(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  static distanceSquared(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return dx * dx + dy * dy;
  }

  static dot(a, b) {
    return a.x * b.x + a.y * b.y;
  }

  static lerp(a, b, t) {
    return new Vector2(
      a.x + (b.x - a.x) * t,
      a.y + (b.y - a.y) * t
    );
  }

  clone() {
    return new Vector2(this.x, this.y);
  }

  length() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  lengthSquared() {
    return this.x * this.x + this.y * this.y;
  }

  normalize() {
    const length = this.length();
    if (length > 0) {
      this.x /= length;
      this.y /= length;
    }
    return this;
  }

  normalized() {
    return this.clone().normalize();
  }

  scale(scalar) {
    this.x *= scalar;
    this.y *= scalar;
    return this;
  }

  scaled(scalar) {
    return this.clone().scale(scalar);
  }

  add(other) {
    this.x += other.x;
    this.y += other.y;
    return this;
  }

  added(other) {
    return new Vector2(this.x + other.x, this.y + other.y);
  }

  subtract(other) {
    this.x -= other.x;
    this.y -= other.y;
    return this;
  }

  subtracted(other) {
    return new Vector2(this.x - other.x, this.y - other.y);
  }

  rotate(angle) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const newX = this.x * cos - this.y * sin;
    const newY = this.x * sin + this.y * cos;
    this.x = newX;
    this.y = newY;
    return this;
  }

  rotated(angle) {
    return this.clone().rotate(angle);
  }

  angle() {
    return Math.atan2(this.y, this.x);
  }

  angleTo(other) {
    const diff = other.subtracted(this);
    return diff.angle();
  }

  set(x, y) {
    this.x = x;
    this.y = y;
    return this;
  }

  zero() {
    this.x = 0;
    this.y = 0;
    return this;
  }

  toString() {
    return `Vector2(${this.x.toFixed(2)}, ${this.y.toFixed(2)})`;
  }
}
