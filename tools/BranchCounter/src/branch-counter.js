#! /usr/bin/env node

let fs = require('fs');
let UglifyJS = require('uglify-js');
let oid = require('oid');

class BranchTreeNode {
  constructor (node = null) {
    this.node = node;
    this.hash = oid.hash(node);
    this.children = oid.createMap();

    this.has = this.has.bind(this);
    this.child = this.child.bind(this);
    this.push = this.push.bind(this);
  }

  has (node) {
    return this.children.has(oid.hash(node));
  }

  child (node) {
    return this.children.get(oid.hash(node));
  }

  push (node) {
    this.children.set(
      oid.hash(node), new BranchTreeNode(node)
    );
  }
}

let btRoot = new BranchTreeNode();

let code = fs.readFileSync('./_test.js', "utf8");
let toplevel = UglifyJS.parse(code, { filename: '_test.js' });
let walker = new UglifyJS.TreeWalker(function(node, descend) {
  if (node instanceof UglifyJS.AST_If) {
    let btCurr = btRoot;
    for (let i = 0; i < walker.stack.length - 1; ++i) {
      let pnode = walker.stack[i];
      if (pnode instanceof UglifyJS.AST_If) {
        // If everything is right, then btCurr must have the pnode.
        if (btCurr.has(pnode)) {
          btCurr = btCurr.child(pnode);
        } else {
          throw new Error('Wrong!');
        }
      } else {
        // Don't care. Just go on.
      }
    }

    // When the entire stack is completely traversed, btCurr should be the
    // desired parent node.
    btCurr.push(node);
  }
})

toplevel.walk(walker);
