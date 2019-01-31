/* eslint-disable one-var, space-before-function-paren */
module.exports = function({ template, types: t }) {
  const pushComputedProps = pushComputedPropsLoose

  const buildForOfArray = template(`
    for (var KEY = 0; KEY < ARR.length; KEY++) BODY;
  `)

  const buildForOfLoose = template(`
    for (var INDEX = 0; INDEX < ARRAY.length; INDEX++) {
      INTERMEDIATE;
      ID = ARRAY[INDEX];
    }
  `)

  function _ForOfStatementArray(path) {
    const { node, scope } = path
    const nodes = []
    let right = node.right

    if (!t.isIdentifier(right) || !scope.hasBinding(right.name)) {
      const uid = scope.generateUidIdentifier('arr')
      nodes.push(
        t.variableDeclaration('var', [t.variableDeclarator(uid, right)])
      )
      right = uid
    }

    const iterationKey = scope.generateUidIdentifier('i')

    let loop = buildForOfArray({
      BODY: node.body,
      KEY: iterationKey,
      ARR: right,
    })

    t.inherits(loop, node)
    t.ensureBlock(loop)

    const iterationValue = t.memberExpression(right, iterationKey, true)

    const left = node.left
    if (t.isVariableDeclaration(left)) {
      left.declarations[0].init = iterationValue
      loop.body.body.unshift(left)
    } else {
      loop.body.body.unshift(
        t.expressionStatement(
          t.assignmentExpression('=', left, iterationValue)
        )
      )
    }

    if (path.parentPath.isLabeledStatement()) {
      loop = t.labeledStatement(path.parentPath.node.label, loop)
    }

    nodes.push(loop)

    return nodes
  }

  function replaceWithArray(path) {
    if (path.parentPath.isLabeledStatement()) {
      path.parentPath.replaceWithMultiple(_ForOfStatementArray(path))
    } else {
      path.replaceWithMultiple(_ForOfStatementArray(path))
    }
  }

  return {
    visitor: {
      ForOfStatement(path, state) {
        const right = path.get('right')
        if (
          right.isArrayExpression() ||
          right.isGenericType('Array') ||
          t.isArrayTypeAnnotation(right.getTypeAnnotation())
        ) {
          replaceWithArray(path)
          return
        }

        const { node } = path
        const build = pushComputedProps(path, state)
        const declar = build.declar
        const loop = build.loop
        const block = loop.body

        // ensure that it's a block so we can take all its statements
        path.ensureBlock()

        // add the value declaration to the new loop body
        if (declar) {
          block.body.push(declar)
        }

        // push the rest of the original loop body onto our new body
        block.body = block.body.concat(node.body.body)

        t.inherits(loop, node)
        t.inherits(loop.body, node.body)

        if (build.replaceParent) {
          path.parentPath.replaceWithMultiple(build.node)
          path.remove()
        } else {
          path.replaceWithMultiple(build.node)
        }
      },
    },
  }

  function pushComputedPropsLoose(path, file) {
    const { node, scope, parent } = path
    const { left } = node
    let declar, id, intermediate

    if (
      t.isIdentifier(left) ||
      t.isPattern(left) ||
      t.isMemberExpression(left)
    ) {
      // for (i of test), for ({ i } of test)
      id = left
      intermediate = null
    } else if (t.isVariableDeclaration(left)) {
      // for (let i of test)
      id = scope.generateUidIdentifier('ref')
      declar = t.variableDeclaration(left.kind, [
        t.variableDeclarator(left.declarations[0].id, id),
      ])
      intermediate = t.variableDeclaration('var', [t.variableDeclarator(id)])
    } else {
      throw file.buildCodeFrameError(
        left,
        `Unknown node type ${left.type} in ForStatement`
      )
    }

    const loop = buildForOfLoose({
      ARRAY: node.right,
      INDEX: scope.generateUidIdentifier('i'),
      ID: id,
      INTERMEDIATE: intermediate,
    })

    //
    const isLabeledParent = t.isLabeledStatement(parent)
    let labeled

    if (isLabeledParent) {
      labeled = t.labeledStatement(parent.label, loop)
    }

    return {
      replaceParent: isLabeledParent,
      declar: declar,
      node: labeled || loop,
      loop: loop,
    }
  }
}
