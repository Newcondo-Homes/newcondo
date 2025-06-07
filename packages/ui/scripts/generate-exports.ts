import fs from 'fs'
import path from 'path'

interface ExportInfo {
  filePath: string
  fileName: string
  exports: string[]
}

function extractExports(filePath: string): string[] {
  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    const exportMatches = content.match(/export\s+(?:const|function|class|interface|type)\s+(\w+)/g) || []
    const namedExportMatches = content.match(/export\s*{\s*([^}]+)\s*}/g) || []
    
    const exports: string[] = []
    
    // Extract individual exports
    exportMatches.forEach(match => {
      const exportName = match.match(/export\s+(?:const|function|class|interface|type)\s+(\w+)/)
      if (exportName && exportName[1]) {
        exports.push(exportName[1])
      }
    })
    
    // Extract named exports
    namedExportMatches.forEach(match => {
      const namedExports = match.match(/export\s*{\s*([^}]+)\s*}/)
      if (namedExports && namedExports[1]) {
        const names = namedExports[1]
          .split(',')
          .map(name => name.trim().split(' as ')[0])
          .filter((name): name is string => Boolean(name && name.trim()))
        exports.push(...names)
      }
    })
    
    return [...new Set(exports)] // Remove duplicates
  } catch (error) {
    console.warn(`⚠️  Could not analyze exports for ${filePath}:`, error)
    return []
  }
}

function generateExports(): void {
  const componentsDir = path.join(__dirname, '../src/components/')
  const libDir = path.join(__dirname, '../src/lib')
  const indexPath = path.join(__dirname, '../src/index.ts')
  
  const exportInfos: ExportInfo[] = []
  
  // Analyze UI components
  if (fs.existsSync(componentsDir)) {
    const componentFiles = fs.readdirSync(componentsDir)
      .filter(file => file.endsWith('.tsx'))
    
    componentFiles.forEach(file => {
      const filePath = path.join(componentsDir, file)
      const fileName = file.replace('.tsx', '')
      const exports = extractExports(filePath)
      
      exportInfos.push({
        filePath: `./components/${fileName}`,
        fileName,
        exports
      })
    })
  }
  
  // Analyze lib files
  if (fs.existsSync(libDir)) {
    const libFiles = fs.readdirSync(libDir)
      .filter(file => file.endsWith('.ts'))
    
    libFiles.forEach(file => {
      const filePath = path.join(libDir, file)
      const fileName = file.replace('.ts', '')
      const exports = extractExports(filePath)
      
      exportInfos.push({
        filePath: `./lib/${fileName}`,
        fileName,
        exports
      })
    })
  }
  
  const output = [
    '// Auto-generated exports - Do not edit manually',
    `// Generated on: ${new Date().toISOString()}`,
    `// Total exports: ${exportInfos.reduce((acc, info) => acc + info.exports.length, 0)}`,
    '',
    '// =============================================================================',
    '// UI COMPONENTS',
    '// =============================================================================',
    ...exportInfos
      .filter(info => info.filePath.includes('/components/'))
      .map(info => `export * from "${info.filePath}"`),
    '',
    '// =============================================================================', 
    '// UTILITIES & HELPERS',
    '// =============================================================================',
    ...exportInfos
      .filter(info => info.filePath.includes('/lib/'))
      .map(info => `export * from "${info.filePath}"`),
    '',
    '// =============================================================================',
    '// RE-EXPORTS FOR CONVENIENCE',
    '// =============================================================================',
    '// You can add manual re-exports here if needed',
    ''
  ].join('\n')

  fs.writeFileSync(indexPath, output)
  
  console.log('✅ Export generation complete!')
  console.log(`📦 Generated exports for ${exportInfos.length} files`)
  exportInfos.forEach(info => {
    console.log(`   📄 ${info.fileName}: ${info.exports.length} exports`)
  })
}

if (require.main === module) {
  generateExports()
}

export { generateExports }