using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FYLA.Infrastructure.Data;

namespace FYLA.API.Controllers
{
  [ApiController]
  [Route("api/[controller]")]
  public class TagsController : ControllerBase
  {
    private readonly ApplicationDbContext _context;

    public TagsController(ApplicationDbContext context)
    {
      _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<List<TagDto>>> GetTags()
    {
      try
      {
        var tags = await _context.ServiceProviderTags
            .Select(tag => new TagDto
            {
              Id = tag.Id,
              Name = tag.Name,
              Description = "" // ServiceProviderTag doesn't have Description property
            })
            .ToListAsync();

        return Ok(tags);
      }
      catch (Exception ex)
      {
        Console.WriteLine($"Error getting tags: {ex.Message}");
        return StatusCode(500, new { message = "An error occurred while retrieving tags" });
      }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<TagDto>> GetTag(int id)
    {
      try
      {
        var tag = await _context.ServiceProviderTags
            .FirstOrDefaultAsync(t => t.Id == id);

        if (tag == null)
        {
          return NotFound(new { message = "Tag not found" });
        }

        var tagDto = new TagDto
        {
          Id = tag.Id,
          Name = tag.Name,
          Description = "" // ServiceProviderTag doesn't have Description property
        };

        return Ok(tagDto);
      }
      catch (Exception ex)
      {
        Console.WriteLine($"Error getting tag {id}: {ex.Message}");
        return StatusCode(500, new { message = "An error occurred while retrieving the tag" });
      }
    }
  }

  public class TagDto
  {
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
  }
}
