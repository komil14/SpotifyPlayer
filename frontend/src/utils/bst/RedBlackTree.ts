import { TreeNode, BinarySearchTree } from './BST';

export class RedBlackTree extends BinarySearchTree {
  
  // NOTE: We do NOT need to declare normalize/isLess here anymore.
  // We inherit them because they are 'protected' in the parent class.

  insert(key: string): void {
    // 1. Check Duplicates
    if (this.search(key)) return;

    const z = new TreeNode(key, 'RED');
    let y: TreeNode | null = null;
    let x: TreeNode | null = this.root;

    while (x !== null) {
      y = x;
      // Use inherited protected method
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

    // 2. Fix Up
    this.insertFixup(z);
  }

  private leftRotate(x: TreeNode): void {
    const y = x.right;
    if (!y) return;

    x.right = y.left;
    if (y.left !== null) {
      y.left.p = x;
    }
    
    y.p = x.p;
    
    if (x.p === null) {
      this.root = y;
    } else if (x === x.p.left) {
      x.p.left = y;
    } else {
      x.p.right = y;
    }
    
    y.left = x;
    x.p = y;
  }

  private rightRotate(y: TreeNode): void {
    const x = y.left;
    if (!x) return;

    y.left = x.right;
    if (x.right !== null) {
      x.right.p = y;
    }
    
    x.p = y.p;
    
    if (y.p === null) {
      this.root = x;
    } else if (y === y.p.left) {
      y.p.left = x;
    } else {
      y.p.right = x;
    }
    
    x.right = y;
    y.p = x;
  }

  private insertFixup(z: TreeNode): void {
    while (z.p !== null && z.p.color === 'RED') {
      if (z.p.p === null) break; 

      if (z.p === z.p.p.left) {
        const y = z.p.p.right; // Uncle
        
        if (y !== null && y.color === 'RED') {
          z.p.color = 'BLACK';
          y.color = 'BLACK';
          z.p.p.color = 'RED';
          z = z.p.p;
        } else {
          if (z === z.p.right) {
            z = z.p;
            this.leftRotate(z);
          }
          if (z.p) {
              z.p.color = 'BLACK';
              if (z.p.p) {
                  z.p.p.color = 'RED';
                  this.rightRotate(z.p.p);
              }
          }
        }
      } else {
        const y = z.p.p.left; // Uncle
        
        if (y !== null && y.color === 'RED') {
          z.p.color = 'BLACK';
          y.color = 'BLACK';
          z.p.p.color = 'RED';
          z = z.p.p;
        } else {
          if (z === z.p.left) {
            z = z.p;
            this.rightRotate(z);
          }
          if (z.p) {
              z.p.color = 'BLACK';
              if (z.p.p) {
                  z.p.p.color = 'RED';
                  this.leftRotate(z.p.p);
              }
          }
        }
      }
    }
    if (this.root) this.root.color = 'BLACK';
  }
}