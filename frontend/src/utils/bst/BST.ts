// src/utils/bst/BST.ts

export type NodeColor = "RED" | "BLACK" | "GREEN" | "BLUE";

export class TreeNode {
  _id: number;
  key: string;
  left: TreeNode | null;
  right: TreeNode | null;
  p: TreeNode | null;
  color: NodeColor;

  constructor(key: string, color: NodeColor = "GREEN") {
    this._id = Math.random();
    this.key = key;
    this.left = null;
    this.right = null;
    this.p = null;
    this.color = color;
  }
}

export class BinarySearchTree {
  root: TreeNode | null;

  constructor() {
    this.root = null;
  }

  //   COMPARISON HELPERS (Changed to PROTECTED so RBT can use them)
  protected normalize(s: string): string {
    return s.trim().toLowerCase();
  }

  protected isLess(a: string, b: string): boolean {
    return this.normalize(a).localeCompare(this.normalize(b)) < 0;
  }

  protected isEqual(a: string, b: string): boolean {
    return this.normalize(a) === this.normalize(b);
  }

  //   INSERT
  insert(key: string, color: NodeColor = "GREEN"): void {
    if (this.search(key)) return; // No duplicates

    const z = new TreeNode(key, color);
    let y: TreeNode | null = null;
    let x: TreeNode | null = this.root;

    while (x !== null) {
      y = x;
      if (this.isEqual(z.key, x.key)) return;

      if (this.isLess(z.key, x.key)) {
        x = x.left;
      } else {
        x = x.right;
      }
    }

    z.p = y;

    if (y === null) {
      this.root = z;
    } else if (this.isLess(z.key, y.key)) {
      y.left = z;
    } else {
      y.right = z;
    }
  }

  //  SEARCH
  search(key: string): TreeNode | null {
    let x = this.root;
    while (x !== null) {
      if (this.isEqual(key, x.key)) return x;

      if (this.isLess(key, x.key)) {
        x = x.left;
      } else {
        x = x.right;
      }
    }
    return null;
  }

  //   FIND ALL
  findAll(query: string): TreeNode[] {
    const results: TreeNode[] = [];
    this.inOrderSearch(this.root, this.normalize(query), results);
    return results;
  }

  private inOrderSearch(
    node: TreeNode | null,
    query: string,
    results: TreeNode[]
  ): void {
    if (node !== null) {
      this.inOrderSearch(node.left, query, results);
      if (this.normalize(node.key).includes(query)) {
        results.push(node);
      }
      this.inOrderSearch(node.right, query, results);
    }
  }

  // --- HELPERS ---
  minimum(node: TreeNode): TreeNode {
    let x = node;
    while (x.left !== null) x = x.left;
    return x;
  }

  transplant(u: TreeNode, v: TreeNode | null): void {
    if (u.p === null) {
      this.root = v;
    } else if (u === u.p.left) {
      u.p.left = v;
    } else {
      u.p.right = v;
    }
    if (v !== null) {
      v.p = u.p;
    }
  }

  delete(z: TreeNode): void {
    if (z.left === null) {
      this.transplant(z, z.right);
    } else if (z.right === null) {
      this.transplant(z, z.left);
    } else {
      const y = this.minimum(z.right);
      if (y.p !== z) {
        this.transplant(y, y.right);
        y.right = z.right;
        y.right.p = y;
      }
      this.transplant(z, y);
      y.left = z.left;
      y.left.p = y;
    }
  }

  getHeight(node: TreeNode | null = this.root): number {
    if (node === null) return -1;
    const leftHeight = this.getHeight(node.left);
    const rightHeight = this.getHeight(node.right);
    return Math.max(leftHeight, rightHeight) + 1;
  }

  // --- GET INSERTION PATH (for animation) ---
  getInsertionPath(key: string): TreeNode[] {
    const path: TreeNode[] = [];
    let x = this.root;

    while (x !== null) {
      path.push(x);
      if (this.isEqual(key, x.key)) {
        // Key already exists, return path
        return path;
      }
      if (this.isLess(key, x.key)) {
        x = x.left;
      } else {
        x = x.right;
      }
    }

    // Return the path traversed (will insert under last node in path)
    return path;
  }

  // --- GET SEARCH PATH (for animation) ---
  getSearchPath(key: string): TreeNode[] {
    const path: TreeNode[] = [];
    let x = this.root;

    while (x !== null) {
      path.push(x);
      if (this.isEqual(key, x.key)) {
        // Found it, return the path to this node
        return path;
      }
      if (this.isLess(key, x.key)) {
        x = x.left;
      } else {
        x = x.right;
      }
    }

    // Not found, return the path traversed
    return path;
  }
}
