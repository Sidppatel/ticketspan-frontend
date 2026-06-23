
const SUFFIXES = [
  'Cents', 'Count', 'Capacity', 'Seats', 'Total', 'Subtotal',
  'Fee', 'Rate', 'Percent', 'Quantity',
];

function nameMatchesSuffix(name) {
  if (typeof name !== 'string' || name.length === 0) return null;
  for (const suffix of SUFFIXES) {
    if (name.endsWith(suffix) && name.length > suffix.length) {
      return suffix;
    }
    if (name === suffix.toLowerCase()) {
      return suffix;
    }
  }
  return null;
}

function getNameFromNode(node) {
  if (!node) return null;
  if (node.type === 'Identifier') return node.name;
  if (node.type === 'MemberExpression' && !node.computed && node.property) {
    return node.property.name;
  }
  return null;
}

function isMathEscapeHatch(callee) {
  if (!callee || callee.type !== 'MemberExpression') return false;
  if (callee.object && callee.object.type === 'Identifier' && callee.object.name === 'Math') {
    return ['round', 'floor', 'ceil', 'min', 'max', 'abs'].includes(callee.property.name);
  }
  return false;
}

export default {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow arithmetic on business-domain values in .tsx files. Aggregates must come from the backend.',
      category: 'Architecture',
      recommended: true,
    },
    schema: [],
    messages: {
      binaryOp:
        'Arithmetic ({{op}}) on "{{name}}" (matches business-domain suffix "{{suffix}}") is forbidden in .tsx. Source this value from a backend quote/stats endpoint.',
      reduceSum:
        '.reduce() that sums/multiplies "{{name}}" (matches business-domain suffix "{{suffix}}") is forbidden in .tsx. Ask the backend for the aggregate.',
    },
  },

  create(context) {
    const filename = context.filename || context.getFilename();
    if (!filename.endsWith('.tsx')) return {};

    const FORBIDDEN_OPS = new Set(['+', '-', '*', '/', '%']);

    return {
      BinaryExpression(node) {
        if (!FORBIDDEN_OPS.has(node.operator)) return;

        let parent = node.parent;
        while (parent) {
          if (parent.type === 'CallExpression' && isMathEscapeHatch(parent.callee)) return;
          if (parent.type === 'BinaryExpression') { parent = parent.parent; continue; }
          break;
        }

        for (const side of [node.left, node.right]) {
          const name = getNameFromNode(side);
          if (!name) continue;
          const suffix = nameMatchesSuffix(name);
          if (suffix) {
            context.report({
              node,
              messageId: 'binaryOp',
              data: { op: node.operator, name, suffix },
            });
            return;
          }
        }
      },

      CallExpression(node) {
        if (!node.callee || node.callee.type !== 'MemberExpression') return;
        if (node.callee.property?.name !== 'reduce') return;
        if (node.arguments.length === 0) return;

        const fn = node.arguments[0];
        if (!fn || (fn.type !== 'ArrowFunctionExpression' && fn.type !== 'FunctionExpression')) return;

        const bodyNodes = [];
        if (fn.body.type === 'BlockStatement') {
          for (const stmt of fn.body.body) {
            if (stmt.type === 'ReturnStatement' && stmt.argument) bodyNodes.push(stmt.argument);
          }
        } else {
          bodyNodes.push(fn.body);
        }

        for (const expr of bodyNodes) {
          if (expr.type !== 'BinaryExpression') continue;
          if (!FORBIDDEN_OPS.has(expr.operator)) continue;
          for (const side of [expr.left, expr.right]) {
            const name = getNameFromNode(side);
            if (!name) continue;
            const suffix = nameMatchesSuffix(name);
            if (suffix) {
              context.report({
                node,
                messageId: 'reduceSum',
                data: { name, suffix },
              });
              return;
            }
          }
        }
      },
    };
  },
};
