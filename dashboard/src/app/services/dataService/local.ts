export function setupData(rawData: any) {
  const data = rawData.map((d: any) => {
    const tags = d.tags.split(',')
    const adjustedTags = tags.map((t: any) => {
      switch (t) {
        case 'diversion':
          return 'Diversion'
        case 'duplicate_discounts':
          return  'Duplicate Discounts'
        case 'gpo':
          return  'GPO Prohibition'
        case 'misc':
          return  'Misc'
        case 'database':
          return  'OPAIS Database'
        case 'no_findings':
          return  'No Findings'
      }
    })
    return {...d, hrsa_des: d['entity_abv'], tags: adjustedTags}
  })
  localStorage.setItem('data', JSON.stringify(data))
}

export function setupFilterItems(stateItems: any, hrsaDesItems: any, tagItems:any) {
  const data = parseData()
  const years = data.reduce((acc: any, d: any) => {
    if (acc.includes(d.full_year)) {
      return acc
    } else {
      acc.push(d.full_year)
      return acc
    }
  } , [])
  const yearItems = years.sort().map((year: string, i: any) => {
    const item: any = {}
    item.year = year
    item.id = i
    return item
  })
  const filtersList = [ stateItems, hrsaDesItems, tagItems ]
  const adjustedFilters = filtersList.map((f: any) => {
    return f.map((item: any, i: number) => {
      item.id = i
      return item
    })
  })
  const filterItems = {
    state_items: adjustedFilters[0],
    hrsa_designation_items: adjustedFilters[1],
    tag_items: adjustedFilters[2],
    year_items: yearItems
  }
  localStorage.setItem('filterItems',JSON.stringify(filterItems))
}

export function parseData() {
  const jsonData = localStorage.getItem('data')
  if (jsonData) {
    const data = JSON.parse(jsonData)
    return data
  }
}

function buildQuery(queryParams: any) {
  let query: any = {}
  for (let key in queryParams) {
    if (key === 'years' && queryParams[key].length) {
      query['full_year'] = queryParams[key]
    }
    if (key === 'hrsa_designations' && queryParams[key].length) {
      query['entity_abv'] = queryParams[key]
    }
    if (key === 'states' && queryParams[key].length) {
      query['state'] = queryParams[key]
    }
    if (key === 'entity_keywords' && queryParams[key].length) {
      query['entity_keywords'] = queryParams[key]
    }
    if (key === 'findings_keywords' && queryParams[key].length) {
      query['findings_keywords'] = queryParams[key]
    }
    if (key === 'tags' && queryParams[key].length) {
      const tags = queryParams[key].map((tag: any) => {
        switch (tag) {
          case 'diversion':
            return 'Diversion'
          case 'duplicate_discounts':
            return  'Duplicate Discounts'
          case 'gpo':
            return  'GPO Prohibition'
          case 'misc':
            return  'Misc'
          case 'database':
            return  'OPAIS Database'
          case 'no_findings':
            return  'No Findings'
        }
      })
      query[key] = tags
    }
  }
  return query
}

type RecordQueryParams = {
  years: string[];
  states: string[];
  hrsa_designations: string[];
  entity_keywords: string;
  findings_keywords: string;
  [ key: string ]: any;
}

export function getRecords(queryParams: any) {
  const data = parseData()
  const query = buildQuery(queryParams)
  const filteredData = data.filter((d: any) => {
    for (let key in query) {
      if ( key === 'tags' ) {
        let tagExists = false
        query[key].map((tag: any) => {
          if (d.tags.includes(tag)) {
            tagExists = true
          }
        })
        return tagExists
      }
      if ( key === 'entity_keywords' ) {
        const re =  new RegExp(`${query.entity_keywords}`, 'i')
        if(re.test(d.entity)) {
          return true
        }
      }
      if ( key === 'findings_keywords' ) {
        const re =  new RegExp(`${query.findings_keywords}`, 'i')
        if(re.test(d.opa_findings)) {
          return true
        }
      }
      if (!query[key].includes(d[key])) {
        return false
      }
    }
    return true
  })
  return filteredData
}

export function getFilterItems() {
  const jsonFilterItems = localStorage.getItem('filterItems')
  if (jsonFilterItems) {
    const filterItems = JSON.parse(jsonFilterItems)
    return filterItems
  }
}

type SummaryQueryParams = {
  states: string[];
  [ key: string ]: any;
}

export function getSummary(queryParams: SummaryQueryParams) {
  const data = parseData()
  const yearItems = getFilterItems().year_items.map((item: any) => { return { ...item, count: 0 } })
  const summaryData = data.filter((d: any) => {
    if (queryParams.hrsa_designations.length) {
      return queryParams.hrsa_designations.includes(d.entity_abv)
    }
    return d
  }).reduce((acc: any, d: any) => {
    yearItems.map((item: any) => {
      if (item.year === d.full_year) {
        acc.filter((n: any) => {
          if (item.year === n.year) {
            item['count'] += 1
            if (queryParams.states.length) {
              if (queryParams.states.includes(d.state)) {
                if (item[d.state]) {
                  item[d.state] += 1
                } else {
                  item[d.state] = 1
                }
              }
            }
          }
        })
      }
    })
    return acc
  }, yearItems)
  return summaryData
}

export function getSummaryFindings(queryParams: SummaryQueryParams) {
  const data = getRecords(queryParams)
  const adjustedTagItems = getFilterItems().tag_items.map((tag: any) => {
    const adjTag: any = {}
    adjTag['name'] = tag.title
    adjTag['value'] = 0
    adjTag['color'] = tag.color
    return adjTag
  })
  const summaryFindingsData = data.reduce((acc: any, d: any) => {
    adjustedTagItems.map((tag: any) => {
      if (d.tags.includes(tag.name)) {
        if (tag.value) {
          tag.value += 1
        } else {
          tag.value = 1
        }
      }
    })
    return acc
  }, adjustedTagItems)
  const noFindings = summaryFindingsData.filter((tag: any) => tag.name === 'No Findings')[0]
  const findings = { name: 'Findings', color: '#DB3737', value: data.length - noFindings.value }
  summaryFindingsData.push(findings)
  return summaryFindingsData
}
